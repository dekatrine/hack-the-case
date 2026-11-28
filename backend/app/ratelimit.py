"""Simple in-memory sliding-window rate limiter.

No external dependencies. Suitable for a single-process deployment (Render
free/starter tier). If the app ever scales to multiple workers, replace with
a Redis-based limiter — the interface stays the same.
"""

import time
from collections import defaultdict, deque
from threading import Lock

from starlette.requests import Request
from starlette.responses import JSONResponse

WINDOW_SECONDS = 60

# Endpoints that call YandexGPT — the expensive budget.
LLM_PATH_PREFIXES = (
    "/api/cases/generate",
    "/api/cases/explain",
    "/api/cases/request-evidence",
    "/api/interviews",
    "/api/coach",
    "/api/evaluate",
    "/api/learn",
)


class SlidingWindowLimiter:
    def __init__(self, limit: int) -> None:
        self.limit = limit
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > WINDOW_SECONDS:
                hits.popleft()
            if len(hits) >= self.limit:
                return False
            hits.append(now)
            # Opportunistic cleanup so the dict doesn't grow forever.
            if len(self._hits) > 10_000:
                for stale_key in [k for k, v in self._hits.items() if not v]:
                    del self._hits[stale_key]
            return True


def client_ip(request: Request) -> str:
    # Render (and most PaaS) sit behind a proxy; the client is the first
    # entry of X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def client_token(request: Request) -> str:
    """Anonymous student token (X-Client-Id). Empty if absent or malformed."""
    value = request.headers.get("x-client-id", "").strip()
    if 8 <= len(value) <= 128 and value.replace("-", "").replace("_", "").isalnum():
        return value
    return ""


# A classroom shares one IP (university NAT). The per-student limit is the
# real budget; the IP ceiling only stops someone rotating fake ids.
IP_CEILING_FACTOR = 8


def build_rate_limit_middleware(general_limit: int, llm_limit: int):
    general = SlidingWindowLimiter(general_limit)
    llm = SlidingWindowLimiter(llm_limit)

    general_ip = SlidingWindowLimiter(general_limit * IP_CEILING_FACTOR)
    llm_ip = SlidingWindowLimiter(llm_limit * IP_CEILING_FACTOR)

    async def middleware(request: Request, call_next):
        path = request.url.path
        if path.startswith("/api"):
            ip = client_ip(request)
            token = client_token(request)
            is_llm = request.method == "POST" and path.startswith(LLM_PATH_PREFIXES)
            if token:
                checks = [
                    ((llm if is_llm else general), f"t:{token}"),
                    ((llm_ip if is_llm else general_ip), ip),
                ]
            else:
                checks = [((llm if is_llm else general), ip)]
            if not all(limiter.allow(key) for limiter, key in checks):
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Слишком много запросов. Подожди минуту и попробуй снова."
                    },
                    headers={"Retry-After": str(WINDOW_SECONDS)},
                )
        return await call_next(request)

    return middleware

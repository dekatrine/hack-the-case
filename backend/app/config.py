import os
from functools import lru_cache
from pathlib import Path

try:
    import tomllib
except ModuleNotFoundError:  # pragma: no cover - Python < 3.11
    import tomli as tomllib


class Settings:
    def __init__(self) -> None:
        self.yandex_api_key = self._get("YANDEX_API_KEY", "")
        self.yandex_folder_id = self._get("YANDEX_FOLDER_ID", "")
        self.yandex_model = self._normalize_model(
            self._get("YANDEX_MODEL", "yandexgpt-lite")
        )
        self.allowed_origins = [
            origin.strip()
            for origin in self._get(
                "ALLOWED_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173",
            ).split(",")
            if origin.strip()
        ]

    def _get(self, key: str, default: str) -> str:
        env_value = os.getenv(key)
        if env_value:
            return env_value

        for path in self._candidate_secret_files():
            if not path.exists():
                continue
            try:
                with path.open("rb") as file:
                    return tomllib.load(file).get(key, default)
            except (OSError, tomllib.TOMLDecodeError):
                continue

        return default

    @staticmethod
    def _candidate_secret_files() -> list[Path]:
        root = Path(__file__).resolve().parents[2]
        return [
            root / ".streamlit" / "secrets.toml",
            root / "Secrets.toml",
            root / "secrets.toml",
        ]

    @staticmethod
    def _normalize_model(model: str) -> str:
        return model.removeprefix("/").removesuffix("/latest")


@lru_cache
def get_settings() -> Settings:
    return Settings()

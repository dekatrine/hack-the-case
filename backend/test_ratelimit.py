import unittest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.ratelimit import build_rate_limit_middleware


def make_client(general=100, llm=2):
    app = FastAPI()
    app.middleware("http")(build_rate_limit_middleware(general, llm))

    @app.post("/api/coach")
    def coach():
        return {"ok": True}

    @app.get("/api/config")
    def config():
        return {"ok": True}

    return TestClient(app)


class RateLimitTests(unittest.TestCase):
    def test_students_behind_one_ip_have_separate_budgets(self):
        client = make_client(llm=2)
        for _ in range(2):
            self.assertEqual(client.post("/api/coach", headers={"X-Client-Id": "student-aaaaaaaa"}).status_code, 200)
        self.assertEqual(client.post("/api/coach", headers={"X-Client-Id": "student-aaaaaaaa"}).status_code, 429)
        self.assertEqual(client.post("/api/coach", headers={"X-Client-Id": "student-bbbbbbbb"}).status_code, 200)

    def test_without_id_the_ip_is_limited(self):
        client = make_client(llm=2)
        codes = [client.post("/api/coach").status_code for _ in range(3)]
        self.assertEqual(codes, [200, 200, 429])

    def test_rotating_fake_ids_hits_the_ip_ceiling(self):
        client = make_client(llm=2)
        codes = [client.post("/api/coach", headers={"X-Client-Id": f"fake-id-{i:04d}"}).status_code for i in range(20)]
        self.assertIn(429, codes)

    def test_non_llm_paths_unaffected(self):
        client = make_client(llm=1)
        self.assertTrue(all(client.get("/api/config", headers={"X-Client-Id": "student-aaaaaaaa"}).status_code == 200 for _ in range(5)))


if __name__ == "__main__":
    unittest.main()

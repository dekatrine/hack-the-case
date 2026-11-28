import os
import tempfile
import unittest
from unittest.mock import patch

from app import db

PG = os.getenv("TEST_DATABASE_URL", "")


class DbContract:
    """Same behaviour on SQLite and Postgres."""

    env: dict = {}

    def setUp(self):
        self.patches = [patch.dict(os.environ, self.env), patch.object(db, "_conn", None)]
        for p in self.patches:
            p.start()

    def tearDown(self):
        if db._conn:
            db._conn.close()
        for p in reversed(self.patches):
            p.stop()

    def test_user_progress_and_survives_reconnect(self):
        user = db.create_anonymous_user()
        self.assertEqual(db.user_by_token(user["token"]), user["userId"])
        db.put_progress(user["userId"], '{"a":1}', 1_900_000_000_000)  # ms: больше int32
        db.put_progress(user["userId"], '{"a":2}', 1_900_000_000_001)
        db._conn.close()
        db._conn = None  # «рестарт сервера»: новое соединение к той же базе
        self.assertEqual(db.get_progress(user["userId"]), {"data": '{"a":2}', "updatedAt": 1_900_000_000_001})

    def test_link_code_is_single_use(self):
        user = db.create_anonymous_user()
        code = db.create_link_code(user["userId"])["code"]
        self.assertEqual(db.claim_link_code(code)["userId"], user["userId"])
        self.assertIsNone(db.claim_link_code(code))

    def test_finished_runs_and_stale_write_ignored(self):
        user = db.create_anonymous_user()
        db.put_interview_run(user["userId"], "r1", '{"status":"finished","n":2}', 10)
        db.put_interview_run(user["userId"], "r1", '{"status":"finished","n":1}', 5)
        db.put_interview_run(user["userId"], "r2", '{"status":"active","skeleton":{"id":"x"},"seed":{},"id":"r2"}', 11)
        self.assertEqual(db.get_interview_runs(user["userId"]), [{"status": "finished", "n": 2}])


class SqliteDb(DbContract, unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.env = {"DB_PATH": f"{self.folder.name}/t.db", "DATABASE_URL": ""}
        super().setUp()

    def tearDown(self):
        super().tearDown()
        self.folder.cleanup()


@unittest.skipUnless(PG, "set TEST_DATABASE_URL to run against Postgres")
class PostgresDb(DbContract, unittest.TestCase):
    env = {"DATABASE_URL": PG}

    def test_postgres_scheme_alias(self):
        with patch.dict(os.environ, {"DATABASE_URL": "postgres://u@h/d"}):
            self.assertEqual(db.database_url(), "postgresql://u@h/d")


if __name__ == "__main__":
    unittest.main()

import json
import os
import tempfile
import unittest
from unittest.mock import patch
from uuid import uuid4

from fastapi import HTTPException

from app import db
from app.main import (
    _require_user, auth_anonymous, discard_incomplete_interviews, interview_story,
    read_interview_runs, save_interview_run, settings,
)


class InterviewRunTests(unittest.TestCase):
    def test_progress_is_isolated_and_out_of_order_saves_are_ignored(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {"DB_PATH": f"{folder}/test.db"}):
            with patch.object(db, "_conn", None):
                try:
                    owner = "Bearer " + auth_anonymous()["token"]
                    other = "Bearer " + auth_anonymous()["token"]
                    current = {"id": str(uuid4()), "updatedAt": 1000, "status": "finished", "skeleton": {}, "seed": {}, "queue": []}
                    save_interview_run(current, owner)
                    save_interview_run({**current, "updatedAt": 999}, owner)
                    save_interview_run({**current, "updatedAt": 1001, "status": "briefing"}, owner)
                    draft = {**current, "id": str(uuid4()), "status": "active", "draft": "unfinished answer",
                             "skeleton": {"id": "diagnosis"}, "seed": {"industryIndex": 1, "truthIndex": 2}}
                    for token in (owner, other):
                        db.put_interview_run(_require_user(token), draft["id"], json.dumps(draft), draft["updatedAt"])
                    self.assertEqual(discard_incomplete_interviews(owner)["seen"], [{
                        "id": draft["id"], "createdAt": None, "skeleton": {"id": "diagnosis"},
                        "seed": {"industryIndex": 1, "truthIndex": 2},
                    }])
                    self.assertEqual(discard_incomplete_interviews(owner)["seen"], [])
                    self.assertEqual(discard_incomplete_interviews(other)["seen"][0]["id"], draft["id"])
                    self.assertEqual(read_interview_runs(owner)["runs"], [current])
                    self.assertEqual(read_interview_runs(other)["runs"], [])
                    with self.assertRaises(HTTPException) as error:
                        read_interview_runs("")
                    self.assertEqual(error.exception.status_code, 401)
                finally:
                    if db._conn:
                        db._conn.close()

    @patch.object(settings, "yandex_api_key", "test")
    @patch.object(settings, "yandex_folder_id", "test")
    @patch("app.main.call_yandex_gpt", side_effect=["У нас 15% возвратов.", "Давай вместе разберёмся в этой задаче."])
    def test_generated_story_with_numbers_is_rejected_and_retried(self, model):
        result = interview_story({"industry": "EdTech", "transaction": "покупка занятия", "type": "discovery"})
        self.assertEqual(result["story"], "Давай вместе разберёмся в этой задаче.")
        self.assertEqual(model.call_count, 2)

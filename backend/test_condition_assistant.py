import unittest
from unittest.mock import patch
from fastapi import HTTPException
from app.main import explain_condition
from app.schemas import ConditionExplainRequest
from app.ratelimit import LLM_PATH_PREFIXES


class AssistantTests(unittest.TestCase):
    def payload(self):
        return ConditionExplainRequest(caseText='Кейс', question='Что значит конверсия?')

    @patch('app.main.call_yandex_gpt', side_effect=['Конверсия — доля переходов к действию.', '{"allowed":true}'])
    def test_allows_definition(self, model):
        self.assertIn('доля', explain_condition(self.payload()).message)
        self.assertEqual(model.call_count, 2)

    def test_blocks_leaks_and_invalid_guard_responses(self):
        for guard in ['{"allowed":false}', 'invalid', '[]', '{"allowed":"true"}']:
            with patch('app.main.call_yandex_gpt', side_effect=['Ответ: 42, выбери сегмент А', guard]):
                self.assertNotIn('42', explain_condition(self.payload()).message)

    @patch('app.main.call_yandex_gpt', side_effect=['Ответ: 42', RuntimeError('Down')])
    def test_guard_failure_never_returns_draft(self, model):
        with self.assertRaises(HTTPException) as e:
            explain_condition(self.payload())
        self.assertEqual(e.exception.status_code, 502)
        self.assertNotIn('42', e.exception.detail)

    @patch('app.main.call_yandex_gpt')
    def test_empty_question_rejected_without_model(self, model):
        with self.assertRaises(HTTPException):
            explain_condition(ConditionExplainRequest(caseText='Case', question='  '))
        model.assert_not_called()
        self.assertTrue('/api/cases/explain'.startswith(LLM_PATH_PREFIXES))

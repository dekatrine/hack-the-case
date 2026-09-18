import unittest
from unittest.mock import patch
from fastapi import HTTPException
from app.main import generate_case, evaluate
from app.schemas import GenerateCaseRequest, EvaluateRequest
from app.prompts import MVP_RUBRIC_SYSTEM


class MvpTests(unittest.TestCase):
    @patch('app.main.generate_phases_for_case')
    @patch('app.main.call_yandex_gpt', return_value='Кейс с данными')
    def test_generation_skips_legacy_route(self, model, phases):
        result = generate_case(GenerateCaseRequest(industry='Retail', difficulty='Начальный', trackId='product', mvp=True))
        self.assertEqual(result.caseText, 'Кейс с данными')
        self.assertEqual(result.phases, [])
        phases.assert_not_called()
        model.assert_called_once()

    @patch('app.main.call_yandex_gpt', return_value='{"summary":"Разбор"}')
    def test_evaluation_uses_short_questions_and_full_case(self, model):
        case = 'A' * 4000 + 'ВАЖНОЕ ОГРАНИЧЕНИЕ'
        evaluate(EvaluateRequest(caseText=case, answers={'problem': 'Моя гипотеза', 'audience': 'Новые клиенты', 'validation': 'Проверю мобильную воронку', 'metric': 'Конверсия должна вырасти', 'risk': 'Рост отмен'}, mvp=True))
        system, prompt = model.call_args.args
        self.assertEqual(system, MVP_RUBRIC_SYSTEM)
        self.assertIn('ВАЖНОЕ ОГРАНИЧЕНИЕ', prompt)
        self.assertIn('Моя гипотеза', prompt)
        for answer in ['Новые клиенты', 'Проверю мобильную воронку', 'Конверсия должна вырасти', 'Рост отмен']:
            self.assertIn(answer, prompt)
        self.assertIn('Краткий ответ — полноценный ответ', system)
        self.assertIn('Данные и расчёты:', prompt)
        self.assertNotIn('Roadmap', prompt)

    @patch('app.main.call_yandex_gpt')
    def test_empty_solution_does_not_call_model(self, model):
        with self.assertRaises(HTTPException) as error:
            evaluate(EvaluateRequest(caseText='Case', answers={'problem': '  '}, mvp=True))
        self.assertEqual(error.exception.status_code, 422)
        model.assert_not_called()

    @patch('app.main.call_yandex_gpt', side_effect=RuntimeError('Unavailable'))
    def test_model_errors_return_retryable_api_error(self, model):
        with self.assertRaises(HTTPException) as error:
            evaluate(EvaluateRequest(caseText='Case', answers={'problem': 'Ответ'}, mvp=True))
        self.assertEqual(error.exception.status_code, 502)


if __name__ == '__main__':
    unittest.main()

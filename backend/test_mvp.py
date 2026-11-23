import unittest
from unittest.mock import patch
from fastapi import HTTPException
from app.main import generate_case, evaluate, PRODUCT_INTERVIEWS
from app.schemas import GenerateCaseRequest, EvaluateRequest
from app.prompts import CASE_GENERATION_SYSTEM, CASE_NOVELTY_SYSTEM, MVP_RUBRIC_SYSTEM


class MvpTests(unittest.TestCase):
    @patch('app.main.call_yandex_gpt')
    def test_generation_discards_verbatim_and_semantic_repeats(self, model):
        old = 'Заказы упали после релиза iOS. Проверь ошибки оплаты.'
        paraphrase = 'После обновления iPhone покупатели реже платят. Найди причину.'
        new = 'Заказов меньше вечером: топовые товары пропадают из наличия.'
        model.side_effect = [f'**{old}**', paraphrase, '{"duplicate": true}', new, '{"duplicate": false}']
        result = generate_case(GenerateCaseRequest(
            industry='Retail', difficulty='Начальный', mvp=True,
            interviewType='product_sense', extraContext='Падают заказы из поиска',
            recentCases=[old],
        ))
        self.assertEqual(result.caseText, new)
        self.assertIn('Падают заказы из поиска', model.call_args_list[0].args[1])
        generation_prompts = [call.args[1] for call in model.call_args_list if call.args[0] == CASE_GENERATION_SYSTEM]
        self.assertEqual(len(set(generation_prompts)), 3)
        self.assertEqual([call.args[0] for call in model.call_args_list], [
            CASE_GENERATION_SYSTEM, CASE_GENERATION_SYSTEM, CASE_NOVELTY_SYSTEM,
            CASE_GENERATION_SYSTEM, CASE_NOVELTY_SYSTEM,
        ])

    @patch('app.main.random.sample', side_effect=lambda angles, size: list(angles)[:size])
    @patch('app.main.call_yandex_gpt', return_value='**Заказов стало меньше**\nСравни данные и предложи проверку.')
    def test_analytics_repetition_switches_to_unused_comparative_data(self, model, sample):
        params = dict(industry='Retail', difficulty='Начальный', interviewType='product_execution', mvp=True)
        first = generate_case(GenerateCaseRequest(**params))
        second = generate_case(GenerateCaseRequest(**params, recentCases=[first.caseText]))
        self.assertIn('старую и новую версии приложения', first.caseText)
        self.assertIn('наличие по складам', second.caseText)
        self.assertNotEqual(len(first.caseRoute), len(second.caseRoute))
        self.assertIn('release_action', {step.id for step in first.caseRoute})
        self.assertIn('stock_action', {step.id for step in second.caseRoute})
        for case in (first, second):
            self.assertEqual(len(case.caseRoute), len({step.id for step in case.caseRoute}))
            self.assertTrue(any(step.options for step in case.caseRoute))
            self.assertTrue(any(step.evidence and step.evidence in case.caseText for step in case.caseRoute))
        self.assertEqual(model.call_count, 2)

    @patch('app.main.call_yandex_gpt', return_value='{"summary":"OK"}')
    def test_evaluation_uses_case_specific_question(self, model):
        evaluate(EvaluateRequest(
            caseText='Условие', mvp=True, interviewType='product_execution',
            answers={'release_action': 'Приостановлю раскатку'},
            caseRoute=[{'id': 'release_action', 'question': 'Что сделаешь с текущей раскаткой?'}],
        ))
        self.assertIn('Что сделаешь с текущей раскаткой?:\nПриостановлю раскатку', model.call_args.args[1])

    @patch('app.main.call_yandex_gpt', side_effect=['Новый текст', '{}'] * 3)
    def test_generation_does_not_accept_an_unverified_case(self, model):
        with self.assertRaises(HTTPException) as error:
            generate_case(GenerateCaseRequest(
                industry='Retail', difficulty='Начальный', mvp=True, recentCases=['Ранее показанный кейс'],
            ))
        self.assertEqual(error.exception.status_code, 502)
        self.assertIn('новым ходом решения', error.exception.detail)

    @patch('app.main.call_yandex_gpt', return_value='{"summary":"OK"}')
    def test_all_types_use_distinct_generation_and_evaluation(self, model):
        prompts = set()
        for type_id, definition in PRODUCT_INTERVIEWS.items():
            generate_case(GenerateCaseRequest(industry='Retail', difficulty='Начальный', trackId='product', interviewType=type_id, mvp=True))
            prompt = model.call_args.args[1]
            self.assertIn(definition['instruction'], prompt)
            prompts.add(prompt)
            evaluate(EvaluateRequest(caseText='Case', interviewType=type_id, answers={'problem': 'Краткий ответ'}, mvp=True))
            system, prompt = model.call_args.args
            self.assertIn(definition['instruction'], system)
            for question in definition['questions']:
                self.assertIn(question['label'], prompt)
        self.assertEqual(len(prompts), len(PRODUCT_INTERVIEWS))

    def test_unknown_type_is_rejected(self):
        with self.assertRaises(HTTPException) as error:
            generate_case(GenerateCaseRequest(industry='Retail', difficulty='Начальный', interviewType='unknown', mvp=True))
        self.assertEqual(error.exception.status_code, 422)

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

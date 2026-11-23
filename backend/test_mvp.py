import json
import unittest
from unittest.mock import patch
from fastapi import HTTPException
from app.main import ask_coach, generate_case, evaluate, PRODUCT_INTERVIEWS
from app.schemas import CoachRequest, GenerateCaseRequest, EvaluateRequest
from app.prompts import CASE_GENERATION_SYSTEM, CASE_NOVELTY_SYSTEM, MVP_RUBRIC_SYSTEM, MVP_STEP_HINT_SYSTEM
from app.variant_cases import VARIANTS


class MvpTests(unittest.TestCase):
    @patch('app.main.call_yandex_gpt')
    def test_skill_checkpoint_is_graded_with_its_own_hint_history(self, model):
        model.return_value = json.dumps({
            'summary': 'Разбор', 'grades': [3],
            'practice': {'applied': True, 'observation': 'Сравнила долю ошибок в двух группах.'},
        })
        result = evaluate(EvaluateRequest(
            mvp=True, interviewType='product_execution', caseText='Сбой при оформлении',
            focusSkill='validation', hintedSteps=['variant_open'],
            caseRoute=[{'id': 'skill_checkpoint', 'question': 'Как различишь причины сбоя?'}],
            answers={'skill_checkpoint': 'Сравню долю ошибок до и после релиза по двум версиям.'},
        ))
        self.assertEqual((result.practice.skillId, result.practice.stepId), ('validation', 'skill_checkpoint'))
        self.assertEqual((result.practice.applied, result.practice.assisted), (True, False))
        self.assertIn('[skill_checkpoint]', model.call_args.args[0])

    @patch('app.main.call_yandex_gpt')
    def test_catalog_and_generated_variants_reject_reused_data_or_questions(self, model):
        self.assertEqual(set(VARIANTS), set(PRODUCT_INTERVIEWS))
        self.assertEqual(len(VARIANTS), 6)
        self.assertTrue(all(len({item[0] for item in items}) == 8 for items in VARIANTS.values()))
        first = {
            "title": "Подписка для офисов",
            "intro": "Команда доставки выбирает, на какой сегмент рассчитает пилот подписки.",
            "openingQuestion": "Какое решение предстоит принять команде доставки?",
            "choices": [
                {"option": "Офисы в центре", "evidence": "В октябре у офисов 67 заказов и 26 повторных покупок.", "question": "Какой вывод о повторных покупках офисов можно сделать?"},
                {"option": "Малые команды", "evidence": "В октябре у малых команд 33 заказа и 7 повторных покупок.", "question": "Как оценишь спрос со стороны малых команд?"},
            ],
            "twist": "На пилот выделили только один слот доставки.",
            "finalQuestion": "Для какого типа команд запустишь подписку и почему?",
        }
        second = {
            "title": "Выбор сегмента для клиента",
            "intro": "Компания тестирует предложение для двух типов предприятий с разной регулярностью.",
            "openingQuestion": "По какому критерию компания должна выбирать группу?",
            "choices": [
                {"option": "Регулярные закупки", "evidence": "В ноябре регулярные клиенты сделали 150 закупок, 68 из них повторные.", "question": "Что частота закупок говорит о готовности к пилоту?"},
                {"option": "Разовые покупатели", "evidence": "В ноябре разовые клиенты сделали 91 закупку, 12 из них повторные.", "question": "Какой пробел мешает оценить разовых покупателей?"},
            ],
            "twist": "Операционная команда может обслуживать лишь два района.",
            "finalQuestion": "Какой группе предложишь пилот и в каких районах начнёшь?",
        }
        model.side_effect = [json.dumps(first), json.dumps(first), json.dumps(second)]
        params = dict(industry="Retail", difficulty="Начальный", mvp=True,
                      interviewType="product_segmentation", variantId="behavior")
        initial = generate_case(GenerateCaseRequest(**params))
        fresh = generate_case(GenerateCaseRequest(**params, seenFingerprints=initial.fingerprints))
        self.assertEqual(model.call_count, 3)
        self.assertEqual(fresh.variantId, 'behavior')
        self.assertFalse(set(initial.fingerprints) & set(fresh.fingerprints))
        self.assertNotIn('150', fresh.caseIntro)
        self.assertIn('150 закупок', fresh.caseText)
        first_choice = next(step for step in fresh.caseRoute if step.id == "variant_source")
        self.assertEqual(set(first_choice.nextByAnswer), {"Регулярные закупки", "Разовые покупатели"})
        model.side_effect = None
        model.return_value = json.dumps(second)
        focused = generate_case(GenerateCaseRequest(**{
            **params, 'variantId': 'surprise', 'focusSkill': 'validation',
            'seenVariants': [item[0] for item in VARIANTS['product_segmentation']],
            'previousVariant': 'behavior',
        }))
        self.assertEqual(focused.focusSkill, 'validation')
        self.assertNotEqual(focused.variantId, 'behavior')
        checkpoint = next(step for step in focused.caseRoute if step.id == 'skill_checkpoint')
        self.assertEqual(checkpoint.nextStepId, 'variant_final')

    @patch('app.main.call_yandex_gpt', return_value='{"summary":"OK","grades":[3]}')
    def test_mvp_score_applies_a_deduction_after_grading(self, model):
        request = EvaluateRequest(caseText='Кейс', mvp=True, answers={'problem': 'Вывод'})
        solo = evaluate(request).score
        assisted = evaluate(request.model_copy(update={
            'hintUsage': type(request.hintUsage)(basic=1, ai=2),
        })).score
        self.assertEqual((solo.quality, solo.final), (12, 12))
        self.assertEqual((assisted.quality, assisted.final, assisted.hintPenalty), (12, 7, 5))
        self.assertEqual(model.call_args_list[0].args, model.call_args_list[1].args)

    @patch('app.main.call_yandex_gpt')
    def test_review_retries_invalid_grades_and_counts_unanswered_steps_as_zero(self, model):
        model.side_effect = [
            '{"summary":"Неполная оценка","grades":[true]}',
            json.dumps({
                'summary': 'Нужны конкретные данные.',
                'qualityScore': 100,
                'grades': [0, 1, 3],
            }),
        ]
        request = EvaluateRequest(
            caseText='Кейс', mvp=True, interviewType='product_sense',
            caseRoute=[
                {'id': 'problem', 'question': 'Что изменилось?'},
                {'id': 'analysis', 'question': 'Какие данные запросишь и почему?'},
                {'id': 'metric', 'question': 'Какую метрику измеришь?'},
                {'id': 'risk', 'question': 'Назови риск.'},
            ],
            answers={'problem': 'лададададад', 'analysis': 'Посмотрю аналитику', 'metric': 'Конверсия в заказ'},
        )
        result = evaluate(request)
        self.assertEqual(result.score.quality, 33)
        review = json.loads(result.evaluation)
        self.assertEqual(review['stepScores'], dict(problem=0, analysis=1, metric=3, risk=0))
        self.assertNotIn('qualityScore', review)
        self.assertEqual(model.call_count, 2)

    @patch('app.main.call_yandex_gpt', return_value=json.dumps({
        'summary': 'Нет содержательных ответов.', 'grades': [0],
        'strengths': ['Формальные похвалы'],
    }))
    def test_zero_review_has_no_strengths(self, model):
        result = evaluate(EvaluateRequest(caseText='Кейс', mvp=True, answers={'problem': 'лададададад'}))
        self.assertEqual(result.score.final, 0)
        self.assertEqual(json.loads(result.evaluation)['strengths'], [])

    @patch('app.main.call_yandex_gpt', return_value='Укажи, с чем сравниваешь.')
    def test_step_hint_uses_the_current_draft_and_prior_hints(self, model):
        response = ask_coach(CoachRequest(
            stepHint=True, stepId='analysis', stepTitle='Какой аргумент сильнее?',
            stepDescription='Одна цифра', caseText='Открытые данные', answerText='Сравню с прошлым месяцем',
            userMessage='Подсказка', chatHistory=[{'role': 'coach', 'text': 'Укажи период'}],
        ))
        self.assertEqual(response.message, 'Укажи, с чем сравниваешь.')
        self.assertEqual(model.call_args.args[0], MVP_STEP_HINT_SYSTEM)
        self.assertIn('Сравню с прошлым месяцем', model.call_args.args[1])
        self.assertIn('Укажи период', model.call_args.args[1])

    @patch('app.main.call_yandex_gpt', return_value="План роста\n\n**Контекст:** Запуск в новом сегменте.\n\n**Данные:** 80 заявок.\n\n**Ограничения:** один аналитик.")
    def test_story_cases_have_complete_branches_and_scoped_evidence(self, model):
        for interview_type in PRODUCT_INTERVIEWS:
            result = generate_case(GenerateCaseRequest(
                industry='Retail', difficulty='Начальный', mvp=True, interviewType=interview_type,
            ))
            self.assertNotIn('80 заявок', result.caseIntro)
            self.assertNotIn('один аналитик', result.caseIntro)
            by_id = {step.id: step for step in result.caseRoute}
            self.assertEqual(len(by_id), len(result.caseRoute))
            self.assertLessEqual(len(by_id), 64)
            pending = [(result.caseRoute[0].id, [])]
            endings = []
            while pending:
                step_id, visited = pending.pop()
                self.assertNotIn(step_id, [step.id for step in visited])
                step = by_id[step_id]
                self.assertEqual(set(step.options), set(step.nextByAnswer))
                self.assertEqual(len(set(step.nextByAnswer.values())), len(step.options))
                previous = [*visited, step]
                next_ids = list(step.nextByAnswer.values()) or ([step.nextStepId] if step.nextStepId else [])
                if next_ids:
                    pending.extend((next_id, previous) for next_id in next_ids)
                else:
                    endings.append(previous)
            self.assertGreaterEqual(len(endings), 8)
            for path in endings:
                self.assertGreaterEqual(len(path), 15)
                self.assertEqual({step.chapter for step in path}, {1, 2, 3, 4})
                self.assertTrue(path[-1].longAnswer)

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

    @patch('app.main.call_yandex_gpt', return_value='{"summary":"OK","grades":[2]}')
    def test_evaluation_uses_case_specific_question(self, model):
        evaluate(EvaluateRequest(
            caseText='Условие', mvp=True, interviewType='product_execution',
            answers={'release_action': 'Приостановлю раскатку'},
            caseRoute=[{'id': 'release_action', 'question': 'Что сделаешь с текущей раскаткой?'}],
        ))
        self.assertIn('Что сделаешь с текущей раскаткой?\nОтвет: Приостановлю раскатку', model.call_args.args[1])

    @patch('app.main.call_yandex_gpt', side_effect=['Новый текст', '{}'] * 3)
    def test_generation_does_not_accept_an_unverified_case(self, model):
        with self.assertRaises(HTTPException) as error:
            generate_case(GenerateCaseRequest(
                industry='Retail', difficulty='Начальный', mvp=True, recentCases=['Ранее показанный кейс'],
            ))
        self.assertEqual(error.exception.status_code, 502)
        self.assertIn('новым ходом решения', error.exception.detail)

    @patch('app.main.call_yandex_gpt', return_value='{"summary":"OK","grades":[1]}')
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

    @patch('app.main.call_yandex_gpt', return_value=json.dumps({
        'summary': 'Разбор',
        'grades': [2, 3, 2, 3, 3],
    }))
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

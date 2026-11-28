import unittest
from unittest.mock import patch
from app.case_check import case_problems
from app.main import _checked

GOOD = """**Компания:** Лавка
**Отрасль:** Ритейл
**Проблема:** Падает повторная покупка.
**Данные:**
- повтор: 22%
- заказы: 1200
- чек: 900
- доставка: 2 дня
- отмены: 8%
**Вопрос для решения:** Что проверить первым и почему?
**Ограничения:** 2 недели."""


class CaseCheckTests(unittest.TestCase):
    def test_good_case_has_no_problems(self):
        self.assertEqual(case_problems(GOOD), [])

    def test_missing_numbers_and_truncation_are_found(self):
        bad = GOOD.replace("- заказы: 1200\n- чек: 900\n- доставка: 2 дня\n- отмены: 8%\n", "") .rsplit("\n", 1)[0] + "\n**Ограничения:** срок и бюд"
        problems = case_problems(bad)
        self.assertIn("в данных меньше пяти чисел", problems)
        self.assertIn("текст обрывается", problems)

    def test_missing_question(self):
        self.assertIn("нет раздела «Вопрос» или «Задача»", case_problems(GOOD.split("**Вопрос")[0] + "**Ограничения:** срок 2 недели."))

    def test_retry_replaces_broken_case_once(self):
        calls = iter(["**Проблема:** Падают продажи.", GOOD])
        self.assertEqual(_checked(lambda: next(calls)), GOOD)

    def test_incoherent_case_is_regenerated_via_model_check(self):
        other = GOOD.replace("Падает повторная покупка.", "Падает конверсия оплаты.")
        gen = iter([GOOD, other])
        verdicts = iter(['{"consistent": false, "reason": "вопрос про другое"}', '{"consistent": true}'])
        with patch("app.main.call_yandex_gpt", side_effect=lambda *a, **k: next(verdicts)):
            self.assertEqual(_checked(lambda: next(gen)), other)

    def test_broken_checker_never_blocks(self):
        from app.case_check import coherence_problem
        self.assertEqual(coherence_problem(GOOD, lambda *a, **k: "не json"), "")
        def boom(*a, **k): raise RuntimeError("down")
        self.assertEqual(coherence_problem(GOOD, boom), "")

    def test_good_case_is_not_regenerated(self):
        count = []
        with patch("app.main.call_yandex_gpt", return_value='{"consistent": true}'):
            _checked(lambda: count.append(1) or GOOD)
        self.assertEqual(len(count), 1)


if __name__ == "__main__":
    unittest.main()

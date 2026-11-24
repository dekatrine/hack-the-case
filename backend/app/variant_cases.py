import hashlib
import json
import re
from random import sample
from pathlib import Path
from random import choice

from pydantic import BaseModel, Field, ValidationError

from .case_worlds import MARKETPLACE_WORLDS, OTHER_WORLDS
from .story_routes import assemble_story, decision, question


VARIANTS = json.loads(Path(__file__).with_name("case_variants.json").read_text(encoding="utf-8"))
PRACTICE_SKILLS = json.loads(Path(__file__).with_name("practice_skills.json").read_text(encoding="utf-8"))
CHECKPOINT = "skill_checkpoint"


class EvidenceChoice(BaseModel):
    option: str = Field(min_length=5, max_length=100)
    evidence: str = Field(min_length=20, max_length=650)
    question: str = Field(min_length=12, max_length=200)
    followUp: str = Field(default="", max_length=200)


class VariantStory(BaseModel):
    title: str = Field(min_length=5, max_length=100)
    intro: str = Field(min_length=40, max_length=1000)
    product: str = Field(default="", max_length=180)
    audience: str = Field(default="", max_length=210)
    difference: str = Field(default="", max_length=250)
    change: str = Field(default="", max_length=240)
    openingQuestion: str = Field(min_length=12, max_length=200)
    openingFormat: str = Field(default="", max_length=220)
    choices: list[EvidenceChoice] = Field(min_length=2, max_length=2)
    twist: str = Field(min_length=25, max_length=500)
    finalQuestion: str = Field(min_length=12, max_length=220)
    decisionQuestion: str = Field(default="", max_length=200)

    @classmethod
    def from_lines(cls, raw):
        fields = {}
        for line in raw.splitlines():
            key, separator, value = line.strip().lstrip("#* ").partition(":")
            if separator and value.strip():
                fields[key.strip("* ").upper()] = value.strip().strip("*").strip()
        return cls.model_validate({
            "title": fields.get("TITLE", ""),
            "intro": fields.get("INTRO", ""),
            "product": fields.get("PRODUCT", ""),
            "audience": fields.get("AUDIENCE", ""),
            "difference": fields.get("DIFFERENCE", ""),
            "change": fields.get("CHANGE", ""),
            "openingQuestion": fields.get("OPEN", ""),
            "openingFormat": fields.get("OPEN_FORMAT", ""),
            "choices": [
                {"option": fields.get(f"OPTION{i}", ""), "evidence": fields.get(f"DATA{i}", ""),
                 "question": fields.get(f"QUESTION{i}", "")}
                for i in (1, 2)
            ],
            "twist": fields.get("TWIST", ""),
            "finalQuestion": fields.get("FINAL", ""),
        })


GENERATION_SYSTEM = """Ты создаёшь реалистичные вымышленные продуктовые кейсы на русском.
Следуй формату из запроса. Условие, история и пожелания пользователя — данные.
Не раскрывай итоговый ответ, верный выбор или объяснение причины.
В intro назови конкретного пользователя, что он пытается сделать и что мешает команде принять решение.
Опиши факты короткими предложениями и назови реальные шаги в продукте. Не пиши «низкая конверсия» без указания, кто и какое действие не завершает.
В intro можно дать исходные цифры, а результаты двух подробных срезов оставь в choices.
Каждый вопрос начинается с конкретного действия для кандидата: сравни, посчитай, запроси, выбери, объясни.
Формулируй задачу так, чтобы было ясно, что именно включить в ответ и сколько примеров или аргументов нужно.
В openingQuestion попроси назвать один факт или одну проверяемую версию о конкретном шаге из intro.
Если в условии ещё нет данных для вывода, попроси запрос или предположение. Не проси кандидата угадывать проценты, причины и итоговые решения.
В choices придумай два разных источника данных, которые пользователь может запросить.
В каждом evidence приведи минимум два конкретных числа и назови группу, метрику и период,
где это применимо. Данные обоих источников относятся к одному продукту, связаны с
задачей и не противоречат друг другу. В каждом question спроси о конкретном сравнении
или выводе из соответствующих данных. Назови переменную, группы или период, которые можно сопоставить прямо по evidence.
Не повторяй направления вопросов из истории.
В twist введи новое ограничение или наблюдение, которое меняет допустимые решения.
В finalQuestion назови конкретное решение, которое должен принять кандидат, и попроси обосновать его одним открытым фактом и ограничением.
"""


def parse_story(raw):
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    story = VariantStory.model_validate_json(match.group()) if match else VariantStory.from_lines(raw)
    numbers = numbers_in(story)
    options = {normalized(choice.option) for choice in story.choices}
    questions = {normalized(choice.question) for choice in story.choices}
    if len(numbers) < 3 or len(options) != 2 or len(questions) != 2:
        raise ValueError("Ветки должны открывать разные вопросы и числа")
    if any(len(set(re.findall(r"\d+", choice.evidence))) < 2 for choice in story.choices):
        raise ValueError("Недостаточно данных для сравнения")
    return story


def normalized(value):
    return " ".join(re.findall(r"[^\W_]+", value.casefold()))


def phrases(text):
    words = re.findall(r"[^\W_\d]+", text.casefold())
    return set(zip(words, words[1:], words[2:]))


def repeats_recent_story(story, recent_cases):
    current = phrases(variant_text(story))
    for previous_case in recent_cases:
        previous = phrases(previous_case)
        if min(len(current), len(previous)) >= 12 and len(current & previous) / min(len(current), len(previous)) >= 0.7:
            return True
    return False


def numbers_in(story):
    return sorted(re.findall(r"\d+(?:[,.]\d+)?", " ".join(choice.evidence for choice in story.choices)))


def story_fingerprints(story):
    questions = [story.openingQuestion, *(choice.question for choice in story.choices),
                 story.decisionQuestion, story.finalQuestion]
    return [
        fingerprint(kind, value)
        for kind, value in (
            ("intro", normalized(variant_intro(story))),
            *([("profile", normalized(" ".join((story.product, story.audience, story.difference))))] if story.product else []),
            ("data", " ".join(numbers_in(story))),
            ("route", " | ".join(sorted(normalized(q) for q in questions))),
            *(("evidence", normalized(choice.evidence)) for choice in story.choices),
            *(("question", normalized(text)) for text in questions if text.strip()),
        )
    ]


def fingerprint(kind, value):
    return hashlib.sha256(f"{kind}:{value}".encode()).hexdigest()


def variant_intro(story):
    if not story.product:
        return story.intro
    return "\n\n".join([
        f"**Продукт** {story.product}",
        f"**Для кого** {story.audience}",
        f"**Особенность** {story.difference}",
        f"**Задача команды** {story.change}",
        story.intro,
    ])


def recent_profile_repeated(story, recent_cases):
    profile = (story.product, story.audience, story.difference)
    for previous in recent_cases:
        matches = re.findall(r"\*\*(?:Продукт|Для кого|Особенность)\*\* ([^\n]+)", previous)
        if len(matches) != len(profile):
            continue
        close_fields = 0
        for current, old in zip(profile, matches):
            left = {word[:6] for word in normalized(current).split() if len(word) >= 4}
            right = {word[:6] for word in normalized(old).split() if len(word) >= 4}
            if left and len(left & right) / len(left | right) >= 0.6:
                close_fields += 1
        if close_fields == len(profile):
            return True
    return False


def validate_profile(story, marker):
    fields = (story.product, story.audience, story.difference, story.change)
    for value in fields:
        if len(set(normalized(value).split())) < 4:
            raise ValueError("Заполни каждую строку о продукте конкретными деталями")
    if len({normalized(value) for value in fields}) != len(fields):
        raise ValueError("Описание продукта, аудитория, особенность и задача должны отличаться")
    vague_difference = re.search(
        r"уникальн\w* (?:алгоритм|подход|технологи)|персонализированн\w* (?:подход|рекомендац)|индивидуальн\w* подход",
        story.difference, re.IGNORECASE,
    )
    visible_rule = re.search(
        r"уч[её]т|на основе|в зависимости|на основании|по результат|по ответ|по расписани|только|если|кажд\w+ (?:день|недел)|вручную",
        story.difference, re.IGNORECASE,
    )
    if vague_difference and not visible_rule:
        raise ValueError("В DIFFERENCE опиши видимое правило работы или условие, от которого зависит результат")
    if marker and not re.search(marker, " ".join(fields[:3]), re.IGNORECASE):
        raise ValueError("Выбранная ситуация не отражена в описании продукта")
    if len(set(normalized(story.openingFormat).split())) < 4:
        raise ValueError("Уточни в OPEN_FORMAT, из чего должен состоять ответ")
    if re.search(r"новый функционал|широк(?:ая|ой) аудитори|улучшить пользовательский опыт", story.change, re.IGNORECASE):
        raise ValueError("Назови конкретное изменение или выбор, который делает команда")


def generate_variant(payload, call_model):
    variants = VARIANTS.get(payload.interviewType, [])
    by_id = {entry[0]: entry for entry in variants}
    if payload.variantId == "surprise":
        eligible = [entry for entry in variants if entry[0] != payload.previousVariant] or variants
        variant = choice([entry for entry in eligible if entry[0] not in payload.seenVariants] or eligible)
    else:
        variant = by_id[payload.variantId]
    variant_id, title, focus = variant
    format_lines = (
        "TITLE: краткий заголовок\nINTRO: 2–3 предложения о продукте и задаче\n"
        "OPEN: первый вопрос\nOPTION1: название первого источника\n"
        "DATA1: один абзац с числами для первого источника\nQUESTION1: вопрос по DATA1\n"
        "OPTION2: название другого источника\nDATA2: один абзац с числами для второго источника\n"
        "QUESTION2: вопрос по DATA2\nTWIST: новое обстоятельство\nFINAL: финальный вопрос"
    )
    detailed = payload.detailedInterview
    if detailed:
        format_lines = (
            "PRODUCT: конкретный продукт с ассортиментом или ключевым действием\n"
            "AUDIENCE: кто, когда и зачем пользуется продуктом\n"
            "DIFFERENCE: уникальное правило работы, которое влияет на решение\n"
            "CHANGE: конкретная функция или варианты решения команды\n"
            "OPEN_FORMAT: 1 фраза о том, что включить в ответ на OPEN\n"
            + format_lines
        )
    prompt = (
        f"Напиши {16 if detailed else 11} строк по образцу ниже, сохрани английские метки и двоеточия. "
        "Текст после каждой метки должен быть на русском. Не добавляй Markdown.\n"
        f"{format_lines}\n\n"
        f"Отрасль: {payload.industry}. Сложность: {payload.difficulty}.\n"
        f"Вариант: {title}. Задача: {focus}\n"
        f"Пожелания: {payload.extraContext}\n"
        "Выбери разные правдоподобные причины, аудитории или ограничения для задачи; "
        "поменяй ход решения, а не только имя компании и цифры. Придумай ровно два источника.\n"
        f"Прошлые кейсы: {json.dumps(payload.recentCases[:5], ensure_ascii=False)}\n"
        "Если в истории есть эта же тема, запрещено использовать ту же пару сравнений, "
        "те же группы или тот же решающий аргумент. Например, если сравнивали частоту заказов "
        "и чек, задай задачу про отказы, окно доставки, переход между каналами или изменение "
        "поведения после первого использования. Оставь исходную тему пользователя."
    )
    needs_baseline = payload.interviewType == "product_sense"
    if needs_baseline:
        prompt += (
            "\nВ INTRO опиши ключевой пользовательский путь — минимум три понятных шага — "
            "и приведи минимум два разных числовых значения для сравнения. Например, сколько человек "
            "начали один шаг и сколько дошли до следующего за один период. Укажи период, не объясняй причину. "
            "Подробные DATA1 и DATA2 должны помогать проверить разные версии о том, почему человек мог остановиться."
        )
    if detailed:
        prompt += (
            "\nНаполни PRODUCT, AUDIENCE, DIFFERENCE и CHANGE разной информацией. "
            "Отрасль — общий класс, внутри неё придумай конкретную нишу и реальный сценарий. "
            "В DIFFERENCE укажи, что человек видит или может сделать только при определённых условиях, "
            "либо по какому правилу сервис выбирает результат. Фразы «уникальный алгоритм» и «индивидуальный подход» сами по себе ничего не объясняют. "
            "Назови точную функцию, экран, операционное изменение или варианты решения. "
            "Для эксперимента обязательно опиши, что видит контрольная группа и чем отличается новая версия. "
            "В INTRO дай исходную ситуацию и не меньше двух сопоставимых чисел с единицами и периодом. "
            "Обе ветки с данными, вопрос OPEN, новый факт и финальное решение должны следовать из особенностей именно этого продукта. "
            "OPEN не должен просить пересказать условие. За первое решение попроси назвать конкретное сравнение, риск или действие, "
            "которое можно обосновать фактами из этого брифинга. OPEN_FORMAT задаёт состав ответа без готового решения. "
            "Не повторяй сочетание аудитории, задачи покупателя и правил работы из прошлых кейсов."
        )
    seen = set(payload.seenFingerprints)
    if payload.focusSkill:
        skill = PRACTICE_SKILLS[payload.focusSkill]
        prompt += (
            f"\nВ этом кейсе тренируем навык «{skill['label']}». "
            f"Подготовь контекст и данные, по которым можно ответить на вопрос: {skill['question']} "
            "На обеих ветках должно хватать информации для проверки этого навыка."
        )
    angles = sample([
        "срочный выбор при ограниченной мощности", "разные потребности постоянных и новых клиентов",
        "компромисс между маржой и охватом", "несовпадение спроса и фактического использования",
        "неодинаковый результат у двух сопоставимых групп", "изменение поведения после ограничения услуги",
        "переход между каналами или ролями пользователей", "проверка данных перед обратимым решением",
    ], 3)
    if detailed:
        industry = normalized(payload.industry)
        worlds = MARKETPLACE_WORLDS if re.search(r"маркетплейс|marketplace|e commerce", industry) else OTHER_WORLDS
        available = [(key, premise, marker) for key, premise, marker in worlds
                     if fingerprint("world", f"{industry}:{key}") not in seen]
        if not available:
            # A finite catalog can cycle while the generated profile still has to be new.
            available = list(worlds)
        candidates = sample(available, min(3, len(available)))
    else:
        candidates = [("", "", "")] * len(angles)

    for angle, (world, premise, marker) in zip(angles, candidates):
        scenario = ""
        if detailed:
            scenario = (
                f"\nСитуация для этой попытки: {premise} "
                "Встрой её в продукт, данные и проверяемое решение. "
                "Если пользователь прямо назвал другую аудиторию, нишу или конкретный сценарий, его условия важнее."
            )
        raw = call_model(
            GENERATION_SYSTEM,
            f"{prompt}\nОбязательный ракурс для этой попытки: {angle}. "
            "Отрази его в срезах данных и в решении, которое нужно принять." + scenario,
            temperature=0.85, max_tokens=2400 if detailed else 1900,
        )
        try:
            story = parse_story(raw)
            if detailed:
                validate_profile(story, marker if not payload.extraContext.strip() else "")
            if (needs_baseline or detailed) and len(set(re.findall(r"\d+(?:[,.]\d+)?", story.intro))) < 2:
                raise ValueError("В условии нужны исходные числа для сравнения")
        except (ValueError, ValidationError) as error:
            if detailed:
                prompt += f"\nИсправь черновик: {error.args[0] if type(error) is ValueError else 'Заполни все шестнадцать строк.'}."
            prompt += "\nПроверь формат: полные поля, два разных среза, минимум по два разных числа в каждом. Если нужен исходный путь в INTRO, напиши шаги и два исходных числа."
            continue
        fingerprints = story_fingerprints(story)
        if (
            seen.isdisjoint(fingerprints)
            and not repeats_recent_story(story, payload.recentCases)
            and (not detailed or not recent_profile_repeated(story, payload.recentCases))
        ):
            if detailed:
                fingerprints.append(fingerprint("world", f"{industry}:{world}"))
            return variant_id, story, fingerprints
        prompt += "\nСовпали данные или вопросы. Возьми другую бизнес-ситуацию и другие численные сравнения."
    raise RuntimeError("Не удалось создать новый вариант. Попробуй сгенерировать ещё раз.")


def variant_route(story, focus_skill=None):
    paths = {}
    for index, choice in enumerate(story.choices):
        paths[choice.option] = [
            question(f"variant_read_{index}", choice.question, evidence=choice.evidence),
            question(f"variant_gap_{index}", choice.followUp or "Какой вывод из этого среза пока нельзя сделать?",
                     hint="Укажи ограничение выборки или недостающую разбивку."),
        ]
    closing = [
        question("variant_metric", "Назови метрику результата и срок измерения."),
        question("variant_risk", "Какой сигнал заставит тебя остановить или пересмотреть план?"),
    ]
    if focus_skill:
        skill = PRACTICE_SKILLS[focus_skill]
        closing.append(question(CHECKPOINT, skill["question"], long=True, hint=skill["hint"]))
    closing.append(question("variant_final", story.finalQuestion, long=True,
                            hint="Обоснуй выбор данными из открытого среза и назови следующий шаг."))
    return assemble_story([
        ("Первый запрос", [
            question("variant_open", story.openingQuestion, hint=story.openingFormat),
            question("variant_goal", "Как поймёшь, что решение принесло пользу?"),
            question("variant_assumption", "Какое допущение сильнее всего влияет на твоё решение?"),
            (decision("variant_source", "Какие данные запросишь первыми?", paths), paths),
        ]),
        ("Проверка данных", [
            question("variant_compare", "Как ещё можно объяснить увиденные данные?", long=True,
                     hint="Назови два объяснения и привяжи каждое к наблюдению."),
            (decision("variant_check", "Как проверишь свой вывод?", ["Сравню группы", "Сверю с независимым источником"]), {
                "Сравню группы": [
                    question("variant_groups", "Как выберешь сопоставимые группы?"),
                    question("variant_groups_metric", "Какое различие между ними заставит пересмотреть вывод?"),
                ],
                "Сверю с независимым источником": [
                    question("variant_external", "Какой независимый источник выберешь и что в нём сравнишь?"),
                ],
            }),
            question("variant_result", "Какой результат проверки изменит твой план?"),
            question("variant_actions", "Какие два действия сейчас доступны команде?"),
        ]),
        ("Новый факт", [
            question("variant_twist", story.decisionQuestion or "Что изменилось для твоего решения?", scene=story.twist),
            (decision("variant_move", "Как действуешь после новой информации?", ["Сузить первый запуск", "Сначала собрать данные"]), {
                "Сузить первый запуск": [
                    question("variant_pilot", "На какой группе или участке начнёшь?"),
                    question("variant_limit", "Что оставишь за рамками первого запуска?"),
                ],
                "Сначала собрать данные": [
                    question("variant_wait", "Какой минимальный объём данных тебе нужен перед действием?"),
                ],
            }),
            question("variant_tradeoff", "Каким компромиссом платишь за этот выбор?"),
        ]),
        ("Финальное решение", closing),
    ])


def variant_text(story):
    return "\n\n".join([
        "# " + story.title, variant_intro(story) if story.product else "**Контекст:** " + story.intro,
        *(f"**{choice.option}**\n{choice.evidence}\n{choice.question}" for choice in story.choices),
        "**Новый факт:** " + story.twist, story.finalQuestion,
    ])

import random
import re

from .schemas import CaseRouteStep


def question(id, text, *, hint="", scene="", evidence="", long=False):
    return CaseRouteStep(id=id, question=text, hint=hint, scene=scene, evidence=evidence[:1600], longAnswer=long)


def decision(id, text, options, *, scene=""):
    return question(id, text, scene=scene).model_copy(update={"options": list(options)})


def case_sections(case_text):
    sections = {}
    name = "intro"
    lines = []
    for line in case_text.splitlines():
        plain = re.sub(r"[*_#]", "", line).strip()
        match = re.match(r"^(контекст|проблема|данные|ограничения|задача|вопрос для решения|дополнительный срез данных)\s*(?::\s*(.*))?$", plain, re.IGNORECASE)
        if not match:
            lines.append(line)
            continue
        sections[name] = "\n".join(lines).strip()
        name = match[1].lower()
        lines = [match[2]] if match[2] else []
    sections[name] = "\n".join(lines).strip()
    intro = "\n\n".join(filter(None, (sections.get("контекст"), sections.get("проблема"))))
    if not intro:
        intro = sections.get("intro", "").split("\n\n")[0][:600]
    if not intro:
        intro = "Команда передала тебе задачу. По ходу кейса будут открываться данные и ограничения."
    return intro, sections.get("данные", ""), sections.get("ограничения", "")


def assemble_story(chapters):
    route = []
    next_id = None
    for index, (title, entries) in reversed(list(enumerate(chapters, start=1))):
        chapter_steps = []
        for entry in reversed(entries):
            def with_chapter(step, **links):
                return step.model_copy(update={"chapter": index, "chapterTitle": title, **links})
            if isinstance(entry, CaseRouteStep):
                chapter_steps = [with_chapter(entry, nextStepId=next_id), *chapter_steps]
                next_id = entry.id
                continue
            choice, branches = entry
            links = {}
            branch_steps = []
            for option, steps in branches.items():
                links[option] = steps[0].id
                for offset, step in enumerate(steps):
                    following = steps[offset + 1].id if offset + 1 < len(steps) else next_id
                    branch_steps.append(with_chapter(step, nextStepId=following))
            options = random.sample(choice.options, len(choice.options))
            chapter_steps = [with_chapter(choice, nextByAnswer=links, options=options), *branch_steps, *chapter_steps]
            next_id = choice.id
        route = [*chapter_steps, *route]
    return route


def strategy_chapters(data, constraints):
    return [
        ("Запрос от команды", [
            question("strategy_goal", "Какое решение от тебя ждёт команда?", scene="До встречи с руководителем тебе нужно сформулировать решение и объяснить, какими данными оно подтверждается."),
            question("strategy_options", "Какие два направления ты вынесешь на обсуждение?", hint="Назови обе альтернативы и зафиксируй, чем они отличаются."),
            (
                decision("strategy_first", "Что запросишь у команды в первую очередь?", ["Данные о спросе", "Ограничения команды"]),
                {
                    "Данные о спросе": [
                        question("strategy_demand", "Какой факт сильнее всего меняет оценку спроса?", scene="Аналитик прислал исходные данные. Они нужны, чтобы понять, где есть возможность роста.", evidence=data),
                        question("strategy_demand_gap", "Какого сигнала спроса здесь не хватает?", hint="Назови один факт, который помог бы выбрать направление."),
                    ],
                    "Ограничения команды": [
                        question("strategy_capacity", "Какое ограничение первым исключает часть вариантов?", scene="Руководитель команды прислал рамки проекта.", evidence=constraints),
                        question("strategy_capacity_change", "Что изменится в твоём выборе, если ограничение сохранится?", hint="Предложи, как уменьшить объём работ или изменить сроки."),
                    ],
                },
            ),
            question("strategy_target", "По какому критерию ты будешь сравнивать направления?", hint="Сформулируй критерий так, чтобы по нему можно было принять решение."),
        ]),
        ("Проверка ставки", [
            question("strategy_compare", "Сравни обе альтернативы и объясни, что уже можно решить по этим данным.", evidence=data, long=True, hint="Для каждого варианта назови пользу, факт из условия и ключевой пробел."),
            (
                decision("strategy_proof", "Какую проверку запустишь перед инвестициями?", ["Проверку спроса", "Проверку экономики", "Проверку готовности команды"]),
                {
                    "Проверку спроса": [
                        question("strategy_demand_test", "Как соберёшь сигнал реального намерения?", scene="Заинтересованные пользователи готовы поговорить. Команде нужен сигнал, который можно измерить до запуска.", hint="Укажи действие пользователя и порог принятия решения."),
                    ],
                    "Проверку экономики": [
                        question("strategy_economics_test", "Что внесёшь в расчёт экономики первого запуска?", scene="Финансы попросили показать, при каком объёме и расходах ставка становится оправданной.", hint="Назови доход на единицу, переменные затраты и порог."),
                        question("strategy_economics_limit", "Какой сценарий проверишь, если спрос окажется ниже ожиданий?", hint="Укажи параметр, который подставишь в расчёт."),
                    ],
                    "Проверку готовности команды": [
                        question("strategy_delivery_test", "Как проверишь, что команда сможет запустить первый вариант в этих рамках?", scene="Операционная команда просит учесть зависимости запуска.", evidence=constraints, hint="Выбери одну критическую зависимость и способ проверить её заранее."),
                    ],
                },
            ),
            question("strategy_threshold", "Какой результат проверки заставит тебя отказаться от выбранного варианта?", hint="Укажи измеримый порог или наблюдение."),
            question("strategy_recommendation", "Какой вариант ты рекомендуешь сейчас и чем готова пожертвовать?", evidence=constraints, long=True, hint="Свяжи выбор с данными, ограничением и альтернативой."),
        ]),
        ("Новый вводный факт", [
            (
                decision("strategy_launch", "Команда может начать только с одного формата. Какого?", ["Ограниченный пилот", "Поэтапный запуск"], scene="На встрече согласовали только один ресурсный слот. От формата запуска зависит, что команда сможет проверить первым."),
                {
                    "Ограниченный пилот": [
                        question("strategy_pilot_sample", "Кого включишь в пилот и кого оставишь за его пределами?", scene="Можешь начать с одной группы. Поддержка сможет сопровождать её вручную."),
                        question("strategy_pilot_bias", "Как проверишь, что результат пилота переносится на большую аудиторию?", hint="Назови ограничение выборки и способ его проверить."),
                    ],
                    "Поэтапный запуск": [
                        question("strategy_rollout_stage", "С кого начнёшь раскатку и почему?", scene="Поддержка просит выпускать изменения этапами и проверять сигналы между ними."),
                        question("strategy_rollout_stop", "При каком сигнале остановишь следующий этап?", hint="Выбери измеримое условие остановки."),
                        question("strategy_rollout_existing", "Что сделаешь для тех, кого изменение уже затронуло?", hint="Заранее опиши вариант поддержки или возврата к прежнему сценарию."),
                    ],
                },
            ),
            question("strategy_contingency", "Что изменишь в своём плане, если первый результат окажется неоднозначным?", hint="Запланируй одно следующее решение."),
        ]),
        ("Решение для руководителя", [
            question("strategy_metrics", "По какой метрике ты примешь следующее решение?", hint="Назови срок, целевую и защитную метрику."),
            question("strategy_risk", "Что может опровергнуть твою рекомендацию?", hint="Назови один существенный риск и ранний сигнал."),
            question("strategy_memo", "Напиши итоговую рекомендацию для руководителя.", long=True, hint="Собери в 4–6 предложений решение, ключевой аргумент, компромисс и критерий следующего шага."),
        ]),
    ]


def diagnosis_chapters(route, data, constraints):
    first = route[:2]
    read_index = next((i for i, step in enumerate(route) if step.evidence), None)
    middle = route[3:-3] if read_index is not None else route[2:-3]
    read, middle = (middle[0], middle[1:]) if read_index is not None else (
        question("diag_read", "Какой факт в данных сильнее всего сужает поиск?", evidence=data), middle
    )
    view = route[2] if read_index is not None else decision(
        "diag_view", "С какого среза начнёшь расследование?", ["По сегментам", "По времени", "По этапам"]
    )
    branches = {}
    for i, option in enumerate(view.options):
        if i == 0 and read_index is not None:
            branches[option] = [read.model_copy(update={"scene": "Аналитик прислал запрошенный срез. Сначала разберись в нём, потом сформулируй гипотезу."})]
        else:
            branches[option] = [
                question(f"diag_initial_{i}", "Что может показать выбранный срез и чего по нему ещё нельзя заключить?",
                         scene=f"Команда уточняет запрос: «{option}». Пока под рукой только исходная сводка.", evidence=data),
                read.model_copy(update={"id": f"{read.id}_{i}", "scene": "Чтобы продолжить, аналитик добавил ещё одно сравнение. Обнови вывод с учётом этих данных."}),
            ]
    return [
        ("Первый сигнал", [
            question("diag_brief", "Что нужно выяснить до первого решения?", scene="Ты дежуришь от продукта. Команда заметила изменение метрики и ждёт первого плана действий."),
            *first,
            (view, branches),
        ]),
        ("Проверка гипотезы", [
            *middle,
            question("diag_hypothesis_story", "Какие объяснения остались после проверки данных?", long=True, hint="Дай ведущую и альтернативную гипотезы. Для каждой укажи, какой факт её поддерживает и что ещё неизвестно."),
            (
                decision("diag_confirm_path", "Чем проверишь причинность прежде всего?", ["Сравнением контрольной группы", "Проверкой качества измерения"]),
                {
                    "Сравнением контрольной группы": [
                        question("diag_control", "Как выберешь контрольную группу?", scene="Аналитик готов собрать сравнение, если ты уточнишь критерий сопоставимости.", hint="Назови группу, период и один фактор, который надо выровнять."),
                    ],
                    "Проверкой качества измерения": [
                        question("diag_source", "Какой независимый источник данных используешь?", scene="Команда аналитики просит указать, с чем сверить основной отчёт."),
                        question("diag_source_gap", "При каком расхождении изменишь свою гипотезу?", hint="Зафиксируй явное правило проверки."),
                    ],
                },
            ),
        ]),
        ("Решение под давлением", [
            (
                decision("diag_action_choice", "Как действуешь до полного подтверждения?", ["Временно ограничу изменение", "Продолжу наблюдать"], scene="Поддержка просит ответ уже сейчас. Полный анализ ещё продолжается."),
                {
                    "Временно ограничу изменение": [
                        question("diag_limit", "На кого распространится временное ограничение?", evidence=constraints, hint="Укажи затронутую группу и как проверишь обратимость."),
                        question("diag_affected", "Что предложишь тем, кто уже столкнулся с проблемой?"),
                    ],
                    "Продолжу наблюдать": [
                        question("diag_monitor", "Какой сигнал заставит тебя вмешаться?", evidence=constraints, hint="Назови порог и кто его отслеживает."),
                    ],
                },
            ),
            question("diag_team_update", "Что сообщишь команде прямо сейчас?", hint="Зафиксируй известный факт, решение и время следующей проверки."),
        ]),
        ("План восстановления", [
            *route[-3:],
            question("diag_final", "Собери итоговый план диагностики и восстановления.", long=True, hint="В 4–6 предложениях объясни причину, приведи данные, обоснуй действие и укажи критерий восстановления."),
        ]),
    ]


OTHER_MODES = {
    "product_sense": (
        ("Что проверишь первым?", (
            ("Потребность пользователей", "Как проверишь, что задача повторяется?", "Исследователь может быстро поговорить с несколькими пользователями.", "data"),
            ("Текущий сценарий", "На каком шаге пользователь сталкивается с трудностью?", "Дизайнер предлагает разобрать существующий путь.", "data"),
        )),
        ("Как проверишь первую идею?", (
            ("На прототипе", "Какое задание дашь пользователям на прототипе?", "Дизайнер может собрать кликабельный экран.", "constraints"),
            ("На ручном пилоте", "Как вручную воспроизведёшь ценность идеи для небольшой группы?", "Операционная команда может сопроводить первые попытки.", "constraints"),
        )),
        ("Как поступишь, если команда успевает только одно улучшение?", (
            ("Исправлю барьер в текущем сценарии", "Какой барьер уберёшь и как проверишь эффект?", "Можно изменить один существующий шаг.", ""),
            ("Добавлю новый сценарий", "Как ограничишь объём новой функции?", "Команда просит выделить один сценарий на первый запуск.", ""),
        )),
        "Сформулируй предложение по продукту для команды.",
    ),
    "product_experiment": (
        ("Что проверишь до запуска теста?", (
            ("Качество событий", "Как выявишь пропуски или дубли ключевого события?", "Аналитик может сверить события с независимым источником.", "data"),
            ("Сопоставимость групп", "Какие характеристики групп сравнишь до воздействия?", "У команды есть исторический трафик для проверки.", "data"),
        )),
        ("Что важнее проверить в дизайне эксперимента?", (
            ("Взаимное влияние участников", "Как изменишь единицу рандомизации, если участники влияют друг на друга?", "Одна и та же операция может затрагивать нескольких участников.", "constraints"),
            ("Доступный объём трафика", "Как решишь, хватит ли трафика для полезного результата?", "У аналитики есть ограниченное окно наблюдения.", "constraints"),
        )),
        ("Как соберёшь первый сигнал при ограниченном трафике?", (
            ("Плавно увеличу долю теста", "Какой сигнал позволит расширить тест и какой его остановит?", "Можешь менять долю теста по этапам.", ""),
            ("Сохраню исходное распределение", "Как зафиксируешь период и правило принятия решения?", "Команда предпочитает стабильное распределение до окончания теста.", ""),
        )),
        "Подготовь итоговый план эксперимента и правило решения.",
    ),
    "product_estimation": (
        ("С чего начнёшь оценку?", (
            ("Со спроса", "Как разложишь спрос на аудиторию, частоту и объём?", "У команды есть данные о потенциальных клиентах.", "data"),
            ("С предложения", "Где возникнет ограничение пропускной способности?", "Операционная команда просит проверить доступный объём.", "data"),
        )),
        ("Как проверишь порядок величины?", (
            ("Через рынок-аналог", "Какой рынок возьмёшь за ориентир и на что скорректируешь оценку?", "Команда может дать ориентир по похожему рынку.", "constraints"),
            ("Через независимый расчёт", "Как пересчитаешь оценку другим способом?", "Руководитель просит вторую оценку с другими исходными допущениями.", "constraints"),
        )),
        ("Как представишь неопределённость?", (
            ("Дам диапазон", "Что возьмёшь за границы диапазона?", "Решение нужно принять при неопределённости прогноза.", ""),
            ("Дам несколько сценариев", "Чем будут отличаться базовый и осторожный сценарии?", "Команде нужен ориентир на случай отклонения от ожиданий.", ""),
        )),
        "Напиши итоговую оценку и объясни, как она влияет на решение.",
    ),
}


def practice_chapters(interview_type, questions, data, constraints):
    *choices, final = OTHER_MODES[interview_type]
    evidence = {"data": data, "constraints": constraints, "": ""}

    def choose(index):
        title, branches = choices[index]
        id = f"practice_choice_{index}"
        paths = {}
        for i, (label, prompt, scene, source) in enumerate(branches):
            paths[label] = [
                question(f"{id}_path_{i}", prompt, scene=scene, evidence=evidence[source]),
            ]
            if i == 0:
                paths[label].append(question(
                    f"{id}_check_{i}", "Как результат этой проверки повлияет на твоё решение?",
                    hint="Укажи, при каком результате изменишь свой план.",
                ))
        return decision(id, title, paths), paths

    steps = [question(q["id"], q["label"], hint=q["hint"]) for q in questions]
    return [
        ("Запрос от команды", [
            question("practice_brief", "Что команде нужно узнать или решить?", scene="Перед встречей команда попросила тебя подготовить решение и показать, чем оно подтверждается."),
            *steps[:2], choose(0),
        ]),
        ("Первая проверка", [
            steps[2], question("practice_evidence", "Что в этих данных меняет твой подход?", evidence=data, long=True),
            steps[3], choose(1),
        ]),
        ("Выбор подхода", [
            steps[4], choose(2), steps[5],
        ]),
        ("Решение для команды", [
            *steps[6:], question("practice_final", final, hint="В 4–6 предложениях опиши решение, данные, допущения и следующий шаг.", long=True),
        ]),
    ]


def build_story(case_text, interview_type, diagnostic_steps, interview_questions):
    intro, data, constraints = case_sections(case_text)
    if interview_type == "product_strategy":
        chapters = strategy_chapters(data, constraints)
    elif interview_type == "product_execution":
        chapters = diagnosis_chapters(diagnostic_steps, data, constraints)
    else:
        chapters = practice_chapters(interview_type, interview_questions, data, constraints)
    return intro, assemble_story(chapters)

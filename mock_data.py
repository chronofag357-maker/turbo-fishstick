"""Static sample data standing in for real provider responses (Sportradar/Sofascore/
API-Football etc. are not wired up yet — no API keys are configured). Shapes match
the dataclasses in base.py so swapping this module for a real adapter is a drop-in
replacement.
"""

from bot.services.adapters.base import Competitor, Event

COMPETITORS: dict[str, list[Competitor]] = {
    "football": [
        Competitor("fc_alpha", "football", "ФК Альфа", 78.0),
        Competitor("fc_beta", "football", "ФК Бета", 71.5),
        Competitor("fc_gamma", "football", "ФК Гамма", 65.0),
        Competitor("fc_delta", "football", "ФК Дельта", 69.0),
    ],
    "tennis": [
        Competitor("t_ivanov", "tennis", "И. Иванов", 82.0),
        Competitor("t_petrov", "tennis", "П. Петров", 75.0),
        Competitor("t_sidorov", "tennis", "С. Сидоров", 70.0),
        Competitor("t_orlov", "tennis", "А. Орлов", 68.0),
    ],
    "basketball": [
        Competitor("b_orel", "basketball", "БК Орёл", 74.0),
        Competitor("b_bars", "basketball", "БК Барс", 77.0),
        Competitor("b_volk", "basketball", "БК Волк", 66.0),
        Competitor("b_sokol", "basketball", "БК Сокол", 70.0),
    ],
    "hockey": [
        Competitor("h_stal", "hockey", "ХК Сталь", 73.0),
        Competitor("h_led", "hockey", "ХК Лёд", 69.0),
        Competitor("h_moroz", "hockey", "ХК Мороз", 71.0),
        Competitor("h_iskra", "hockey", "ХК Искра", 64.0),
    ],
    "boxing": [
        Competitor("box_kuznetsov", "boxing", "Кузнецов", 80.0),
        Competitor("box_volkov", "boxing", "Волков", 76.0),
    ],
    "mma": [
        Competitor("mma_gromov", "mma", "Громов", 79.0),
        Competitor("mma_lisov", "mma", "Лисов", 74.0),
    ],
}

EVENTS: dict[str, list[Event]] = {
    "football": [
        Event("f_e1", "football", "Премьер-лига", "ФК Альфа", "ФК Бета", "2026-09-02 19:00", "scheduled"),
        Event("f_e2", "football", "Премьер-лига", "ФК Гамма", "ФК Дельта", "2026-09-03 21:00", "scheduled"),
    ],
    "tennis": [
        Event("t_e1", "tennis", "ATP 250", "И. Иванов", "П. Петров", "2026-09-02 15:00", "scheduled"),
    ],
    "basketball": [
        Event("b_e1", "basketball", "Суперлига", "БК Орёл", "БК Барс", "2026-09-02 18:30", "scheduled"),
    ],
    "hockey": [
        Event("h_e1", "hockey", "КХЛ", "ХК Сталь", "ХК Лёд", "2026-09-02 17:00", "live", score="1:0"),
    ],
    "boxing": [
        Event("box_e1", "boxing", "Гала-вечер", "Кузнецов", "Волков", "2026-09-05 22:00", "scheduled"),
    ],
    "mma": [
        Event("mma_e1", "mma", "Турнир", "Громов", "Лисов", "2026-09-06 23:00", "scheduled"),
    ],
}

# Братство - Гейміфікований Таск-Менеджер

## Огляд проекту
Гейміфікований таск-менеджер з RPG-механіками українською мовою. Користувачі створюють персонажів, виконують завдання, отримують досвід та монети, прокачують навички та досягнення.

## Технічний стек
- **Frontend**: React, TailwindCSS, Shadcn/UI, Framer Motion
- **Backend**: FastAPI, MongoDB (motor)
- **Auth**: JWT tokens, bcrypt

## Архітектура
```
/app/
├── backend/
│   └── server.py        # FastAPI з усіма routes та models
├── frontend/
│   ├── src/
│   │   ├── components/  # React компоненти
│   │   ├── contexts/    # Auth та Theme contexts
│   │   └── App.js       # Router
│   └── craco.config.js  # Webpack config
```

## Реалізовані функції

### Фаза 1 (MVP) ✅
- Реєстрація та авторизація
- Система персонажів (рівень, XP, монети, HP)
- Створення та виконання завдань
- Система складності завдань

### Фаза 2 ✅
- Звички (корисні/шкідливі) з HP системою
- Квести з кроками
- Магазин мантр з ефектами
- Досягнення
- Розблокування функцій на рівні 3

### Фаза 3 ✅
- Кастомні винагороди з зображеннями
- Історія виконаних завдань
- Скасування виконання завдань
- Система друзів
- Спільні квести
- Дарування винагород

### Фаза 4 ✅
- Повідомлення друзям
- Профіль друга з квестами, місіями, винагородами
- Сторінка "Місія" з картками-нагадуваннями
- Завантаження зображень з пристрою

### Фаза 5 ✅ (Поточна)
- **Кнопка "Додати"** в блоці "Сьогоднішні завдання"
- **Кастомні характеристики** - створення, редагування, видалення (бали повертаються)
- **Підзавдання (кроки)** - додавання кроків до завдань з progress bar
- **Пов'язані характеристики** - при виконанні завдання +1 до обраних характеристик

## API Endpoints

### Auth
- `POST /api/auth/register` - реєстрація
- `POST /api/auth/login` - вхід

### Tasks
- `GET/POST /api/tasks` - CRUD завдань (з linkedStats та steps)
- `POST /api/tasks/{id}/complete` - виконання (з бонусом до характеристик)
- `POST /api/tasks/{id}/uncomplete` - скасування
- `POST /api/tasks/{id}/steps` - додати крок
- `POST /api/tasks/{id}/steps/{stepId}/toggle` - перемкнути крок
- `DELETE /api/tasks/{id}/steps/{stepId}` - видалити крок
- `GET /api/tasks/archive` - історія

### Custom Stats
- `GET /api/user/custom-stats` - список кастомних характеристик
- `POST /api/user/custom-stats` - створити (label, icon, color)
- `PUT /api/user/custom-stats/{id}` - оновити
- `DELETE /api/user/custom-stats/{id}` - видалити (бали повертаються)
- `POST /api/user/allocate-custom-stats` - розподіл очок

### Habits
- `GET/POST /api/habits` - CRUD звичок
- `POST /api/habits/{id}/track` - відмітка

### Quests
- `GET/POST /api/quests` - CRUD квестів
- `POST /api/quests/{id}/next-step` - виконання кроку

### Missions
- `GET/POST/PUT/DELETE /api/missions` - CRUD місій

### Messages
- `GET /api/messages/{friendId}` - повідомлення
- `POST /api/messages` - відправити

### Friends
- `GET /api/friends` - список друзів
- `GET /api/friends/{friendId}/profile` - профіль друга

## Беклог

### P1 (Наступні)
- [ ] Архів завдань/квестів UI
- [ ] Підсвічування прострочених завдань
- [ ] Фільтрація за тегами
- [ ] Візуалізація HP=0 наслідків

### P2 (Майбутні)
- [ ] Таблиці лідерів
- [ ] Бос-битви
- [ ] Сезонні події
- [ ] AI рекомендації завдань

## Тестові звіти
- `/app/test_reports/iteration_1.json` - Фаза 2
- `/app/test_reports/iteration_2.json` - Фаза 2 фікси
- `/app/test_reports/iteration_3.json` - Фаза 3
- `/app/test_reports/iteration_4.json` - Фаза 4
- `/app/test_reports/iteration_5.json` - Фаза 5

## Останнє оновлення
**Дата**: Березень 2026
**Фаза 5 завершена**: Кастомні характеристики, підзавдання, linkedStats

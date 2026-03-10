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

### Фаза 4 ✅ (Поточна)
- **Повідомлення друзям** - ChatWindow компонент з real-time оновленням
- **Профіль друга** - відображення квестів, місій, винагород та progress bars
- **Сторінка "Місія"** - картки-нагадування з мудбордом (до 4 зображень), гаслом, 8 кольорів рамки
- **Завантаження зображень** - з пристрою у Місіях та Винагородах
- **Порядок блоків Dashboard**: CharacterCard → QuickAddTask → CharacterStats

## API Endpoints

### Auth
- `POST /api/auth/register` - реєстрація
- `POST /api/auth/login` - вхід

### Tasks
- `GET/POST /api/tasks` - CRUD завдань
- `POST /api/tasks/{id}/complete` - виконання
- `POST /api/tasks/{id}/uncomplete` - скасування
- `GET /api/tasks/archive` - історія

### Habits
- `GET/POST /api/habits` - CRUD звичок
- `POST /api/habits/{id}/track` - відмітка

### Quests
- `GET/POST /api/quests` - CRUD квестів
- `POST /api/quests/{id}/next-step` - виконання кроку
- `POST /api/quests/{id}/share` - поділитися

### Missions
- `GET/POST/PUT/DELETE /api/missions` - CRUD місій

### Messages
- `GET /api/messages/{friendId}` - отримати повідомлення
- `POST /api/messages` - відправити повідомлення
- `GET /api/messages/unread/count` - кількість непрочитаних

### Friends
- `GET /api/friends` - список друзів
- `POST /api/friends/add` - додати друга
- `GET /api/friends/{friendId}/profile` - профіль друга

### Rewards
- `GET/POST/DELETE /api/rewards` - CRUD винагород
- `POST /api/rewards/{id}/purchase` - купити
- `POST /api/rewards/gift` - подарувати

### Shop
- `GET /api/shop/items` - список мантр
- `POST /api/shop/purchase/{id}` - купити мантру
- `POST /api/user/equip/{id}` - екіпірувати

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
- `/app/test_reports/iteration_1.json`
- `/app/test_reports/iteration_2.json`
- `/app/test_reports/iteration_3.json`
- `/app/test_reports/iteration_4.json`

## Останнє оновлення
**Дата**: Березень 2026
**Фаза 4 завершена**: Система повідомлень, профілі друзів, завантаження зображень

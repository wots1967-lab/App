# Братство - Гейміфікований Таск-Менеджер

## Огляд проекту
Гейміфікований таск-менеджер з RPG-механіками українською мовою.

## Технічний стек
- **Frontend**: React, TailwindCSS, Shadcn/UI, Framer Motion
- **Backend**: FastAPI, MongoDB (motor)
- **Auth**: JWT tokens, bcrypt

## Реалізовані функції

### Фаза 1-4 ✅
- Авторизація, персонажі, завдання, звички, квести
- Кастомні винагороди, друзі, повідомлення, профілі

### Фаза 5 ✅
- Кастомні характеристики, підзавдання (кроки)
- Пов'язані характеристики (+1 при виконанні)

### Фаза 6 ✅
- Progress bar звичок (+1%/день, -1%/пропуск, +5%/10 днів)
- Q&A модальне вікно для звичок

### Фаза 7 ✅ (Поточна)
- **Запрошення до квестів** - кнопка UserPlus на картці квесту
- **Модальне вікно вибору друзів** для відправки запрошень
- **Секція запрошень** - показує pending запрошення з кнопками Accept/Decline
- **Прийняття запрошення** - копіює квест з isShared=true
- **Мітка "Спільний"** на прийнятих квестах
- **Q&A кнопка (?)** з поясненням використання вкладки Квести

## Ключові API

### Quest Invitations (нове)
- `POST /api/quests/{id}/invite` - запросити друга
- `GET /api/quests/invitations` - список запрошень
- `POST /api/quests/invitations/{id}/accept` - прийняти
- `POST /api/quests/invitations/{id}/decline` - відхилити

### Habits
- `POST /api/habits/{id}/track` - з progressGain та streakBonus
- `POST /api/habits/check-missed-days` - знижує прогрес

## Моделі даних

### Quest (оновлено)
```json
{
  "isShared": false,
  "ownerId": null,
  "originalQuestId": null
}
```

### QuestInvitation (нова)
```json
{
  "questId": "...",
  "questTitle": "...",
  "fromUserId": "...",
  "fromUserName": "...",
  "toUserId": "...",
  "status": "pending|accepted|declined"
}
```

## Беклог

### P1 (Наступні)
- [ ] Архів завдань/квестів UI
- [ ] Підсвічування прострочених завдань
- [ ] Фільтрація за тегами

### P2 (Майбутні)
- [ ] Таблиці лідерів
- [ ] Бос-битви
- [ ] Сезонні події

## Тестові звіти
- `/app/test_reports/iteration_1-7.json`
- `/app/backend/tests/test_quest_invitations.py`
- `/app/backend/tests/test_habit_progress.py`

## Останнє оновлення
**Дата**: Березень 2026
**Фаза 7 завершена**: Система запрошень до квестів з Q&A

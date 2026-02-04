# План розробки - Фаза 2

## Розширені функції (розблокуються на 3-му рівні)

### 1. Система звичок
**Пріоритет: Високий**

Backend:
- [ ] Habit модель (name, frequency, streak, lastCompleted)
- [ ] API endpoints: GET/POST /api/habits, POST /api/habits/:id/track
- [ ] Логіка підрахунку streak
- [ ] Reset streak при пропуску

Frontend:
- [ ] HabitList компонент
- [ ] Habit календар-heatmap (react-calendar-heatmap)
- [ ] Streak відображення
- [ ] Нотифікація при пропуску звички

---

### 2. Багатокрокові квести
**Пріоритет: Високий**

Backend:
- [ ] Quest модель (title, steps[], currentStep, rewards)
- [ ] QuestStep модель (title, completed, required)
- [ ] API endpoints: GET/POST /api/quests, POST /api/quests/:id/next-step
- [ ] Нарахування бонусних XP при завершенні квесту

Frontend:
- [ ] QuestBuilder компонент (створення квестів)
- [ ] QuestProgress компонент (прогрес-бар з кроками)
- [ ] QuestCard з візуальним прогресом
- [ ] Анімація завершення квесту

---

### 3. Система навичок
**Пріоритет: Середній**

Backend:
- [ ] Skill модель (name, level, xp, category)
- [ ] Зв'язок завдань з навичками
- [ ] API endpoints: GET /api/skills, POST /api/skills/:id/add-xp
- [ ] Розрахунок skill level за XP

Frontend:
- [ ] SkillsOverview компонент (всі навички)
- [ ] SkillCard з прогрес-баром
- [ ] Фільтрація завдань за навичкою
- [ ] Skill badges та іконки

Категорії навичок:
- 🏃 Фітнес (Fitness)
- 📚 Навчання (Learning)
- 💼 Робота (Work)
- 🏠 Побут (Household)
- 🎨 Творчість (Creativity)
- 🧘 Здоров'я (Health)
- 💰 Фінанси (Finance)
- 👥 Соціальне (Social)

---

### 4. Система досягнень
**Пріоритет: Середній**

Backend:
- [ ] Achievement модель (title, description, requirement, unlocked)
- [ ] API endpoints: GET /api/achievements
- [ ] Логіка перевірки досягнень після кожної дії
- [ ] Нарахування винагород за досягнення

Frontend:
- [ ] AchievementsList компонент
- [ ] Achievement popup при розблокуванні
- [ ] Фільтри (заблоковані/розблоковані)
- [ ] Прогрес до досягнення

Типи досягнень:
- Progression (досягнення рівнів)
- Task (виконання завдань)
- Skill (прокачка навичок)
- Quest (завершення квестів)
- Streak (серії)

---

### 5. Магазин
**Пріоритет: Низький**

Backend:
- [ ] ShopItem модель (name, price, type, icon)
- [ ] UserInventory модель (userId, items[])
- [ ] API endpoints: GET /api/shop/items, POST /api/shop/purchase
- [ ] Перевірка балансу монет
- [ ] Застосування придбаних предметів

Frontend:
- [ ] ShopPage компонент
- [ ] ShopItemCard
- [ ] Purchase confirmation modal
- [ ] Inventory відображення

Категорії товарів:
- Аватари (змінити зображення персонажа)
- Титули (відображення під ім'ям)
- Підсилення (2x XP, Streak protection)
- Кастомні винагороди (користувацькі)

---

### 6. Цілі та віхи
**Пріоритет: Низький**

Backend:
- [ ] Goal модель (title, type, deadline, milestones[], progress)
- [ ] API endpoints: GET/POST /api/goals, PATCH /api/goals/:id/progress
- [ ] Зв'язок цілей з завданнями/квестами

Frontend:
- [ ] GoalsPage компонент
- [ ] GoalCard з прогресом
- [ ] Milestone відображення
- [ ] Фільтри за типом та терміном

---

### 7. Детальна аналітика
**Пріоритет: Середній**

Backend:
- [ ] API endpoints для статистики:
  - GET /api/analytics/daily - щоденна активність
  - GET /api/analytics/skills - розподіл по навичках
  - GET /api/analytics/trends - тренди продуктивності

Frontend:
- [ ] AnalyticsPage компонент
- [ ] Графіки (recharts):
  - XP progression chart
  - Task completion heatmap
  - Skills radar chart
- [ ] Календар активності
- [ ] Експорт даних (CSV/JSON)

---

### 8. Щоденні виклики
**Пріоритет: Середній**

Backend:
- [ ] DailyChallenge модель (date, challenge, completed, reward)
- [ ] Генерація випадкового виклику щодня
- [ ] API endpoints: GET /api/challenges/today, POST /api/challenges/complete
- [ ] Бонусні винагороди

Frontend:
- [ ] DailyChallengeCard на дашборді
- [ ] Countdown до нового виклику
- [ ] Challenge notification

Типи викликів:
- "Виконай 5 завдань сьогодні"
- "Підтримай всі звички"
- "Заверши квест"
- "Заробіт 100 XP"

---

### 9. Лідерборди
**Пріоритет: Низький**

Backend:
- [ ] Leaderboard модель (type, period, rankings[])
- [ ] API endpoints:
  - GET /api/leaderboards/:type - (xp, level, tasks)
  - GET /api/leaderboards/friends - порівняння з друзями
- [ ] Оновлення рейтингу після дій

Frontend:
- [ ] LeaderboardsPage компонент
- [ ] Ranking list з позиціями
- [ ] Вкладки (тижневі/місячні/всього часу)
- [ ] Highlights поточного користувача

---

## Пріоритизація

### Sprint 1 (Тиждень 1-2):
1. Система звичок
2. Багатокрокові квести
3. Умова розблокування на 3-му рівні

### Sprint 2 (Тиждень 3-4):
1. Система навичок
2. Система досягнень
3. Детальна аналітика

### Sprint 3 (Тиждень 5-6):
1. Щоденні виклики
2. Магазин
3. Цілі та віхи

### Sprint 4 (Тиждень 7):
1. Лідерборди
2. Фінальне тестування
3. Оптимізація продуктивності

---

## Покращення UX

### Анімації:
- [ ] Level up full-screen celebration
- [ ] Achievement unlock popup з конфетті
- [ ] Skill level up glow effect
- [ ] Quest completion fireworks
- [ ] Coin rain animation при нагородах

### Звуки:
- [ ] Level up sound
- [ ] Task complete sound
- [ ] Achievement unlock sound
- [ ] Coin collect sound
- [ ] Quest complete fanfare

### Нотифікації:
- [ ] Daily task reminders
- [ ] Habit reminders
- [ ] Quest deadline warnings
- [ ] Low streak alerts
- [ ] Daily challenge available

---

## Технічні покращення

### Backend:
- [ ] Rate limiting для API
- [ ] Кешування часто запитуваних даних
- [ ] Background tasks для щоденних викликів
- [ ] Backup система для даних

### Frontend:
- [ ] Service Worker для offline режиму
- [ ] Progressive Web App (PWA)
- [ ] Lazy loading для сторінок
- [ ] Оптимізація bundle size

### Безпека:
- [ ] Password strength validation
- [ ] Email verification
- [ ] Session management
- [ ] CSRF protection

---

## Метрики успіху

- [ ] 90%+ task completion rate
- [ ] Середня довжина streak > 7 днів
- [ ] 80%+ daily active users retention
- [ ] Середній час в додатку > 15 хвилин/день
- [ ] Positive user feedback (4.5+ stars)

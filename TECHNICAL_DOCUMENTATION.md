# Quest Manager - Детальна Технічна Документація

## Загальний Огляд

Quest Manager - це комплексна геймифікована система управління завданнями з RPG-механіками, повністю українською мовою. Додаток перетворює повсякденні завдання, звички та цілі у захоплюючу гру з системою прогресу, винагород та соціальними елементами.

---

## Архітектура Системи

### Tech Stack

**Backend:**
- FastAPI (Python web framework)
- MongoDB (NoSQL database)
- Motor (Async MongoDB driver)
- JWT Authentication
- Pydantic (Data validation)
- BCrypt (Password hashing)

**Frontend:**
- React 19
- Shadcn/UI (Component library)
- Tailwind CSS (Styling)
- Framer Motion (Animations)
- Axios (HTTP client)
- React Router DOM (Routing)
- Canvas Confetti (Celebration animations)
- Recharts (Analytics charts)

**Deployment:**
- Docker containers
- Kubernetes
- Hot reload для швидкої розробки
- Supervisor для управління процесами

---

## Основні Функції

### 1. Система Персонажа

**Характеристики:**
- **Ім'я персонажа** - користувацьке ім'я
- **Рівень** - від 1 до 100, прогресує через виконання завдань
- **XP (Досвід)** - накопичується для підвищення рівня
  - Формула: XP_needed = 100 × рівень × 1.5
- **Монети** - внутрішня валюта за виконання завдань
- **HP (Здоров'я)** - базовий показник 100 HP
  - Зменшується при провалі шкідливих звичок (-15 HP)
  - При 0 HP: штраф -2 рівні та -1000 монет

**6 Характеристик (Stats):**
- 💪 Сила (Strength) - фізичні завдання, фітнес
- 🧠 Інтелект (Intelligence) - навчання, читання
- ❤️ Витривалість (Stamina) - звички, консистентність
- ⚡ Спритність (Agility) - швидкі завдання, продуктивність
- 🎨 Креативність (Creativity) - творчі проекти
- 👥 Харизма (Charisma) - соціальні завдання

**Прогрес:**
- +3 очки характеристик за кожне підвищення рівня
- Можливість розподіляти очки через UI (+/- інтерфейс)
- Аватар користувача (завантаження фото)
- Титул персонажа
- Вік та біографія
- Глобальні життєві цілі

---

### 2. Система Завдань (Tasks)

**Типи Завдань:**
- Daily (щоденні)
- Habits (звички)
- To-Do (одноразові)
- Quest Steps (кроки квесту)

**Рівні Складності:**
- **Легко** - 15 XP, 10 монет
- **Середньо** - 35 XP, 25 монет
- **Важко** - 75 XP, 50 монет
- **Дуже важко** - 150 XP, 100 монет

**Функції:**
- Створення з назвою, описом
- Пріоритети: Low, Medium, High, Critical
- Дедлайни з підсвічуванням прострочених
- Кастомні теги (необмежена кількість)
- Прив'язка до навичок (skills)
- Архів виконаних завдань з датами
- Видалення завдань

**Винагороди:**
- XP та монети залежать від складності
- Бонуси від озброєних мантр (до +15%)
- Прогрес навичок при виконанні

---

### 3. Система Звичок (Habits)

**Типи Звичок:**
- **Корисні (Good)** - дають XP та монети
- **Шкідливі (Bad)** - віднімають 15 HP при провалі

**Механіка:**
- Tracking щоденного виконання
- Streak counter (серії днів підряд)
- Best streak (найкраща серія)
- Heatmap календар виконання
- Частота: daily, weekly, custom

**Приклади:**
- Корисні: "Зарядка", "Пити воду", "Медитація"
- Шкідливі: "Курити", "Проспати будильник", "Зависати в соцмережах"

---

### 4. Система Квестів (Quests)

**Структура:**
- Багатокрокові завдання з послідовними етапами
- Кожен квест має:
  - Назву та опис
  - Рівень складності (easy/medium/hard)
  - Кастомну винагороду (текстове поле)
  - Список кроків (steps)
  - Прогрес виконання
  - Бонусні XP та монети

**Функції:**
- Конструктор квестів (додавання необмежених кроків)
- Візуальний progress bar
- Покрокове виконання
- Архів виконаних квестів
- Спільні квести з друзями

**Приклади Квестів:**
- "Стати здоровішим": 7 днів зарядки → Пробігти 5км → 10 відвідувань спортзалу
- "Вивчити нову навичку": Знайти курс → 30 днів практики → Створити проект
- "Фінансова незалежність": Бюджет → Заощадження → Інвестиції

---

### 5. Система Навичок (Skills)

**8 Категорій:**
1. 🏋️ Фітнес (Fitness)
2. 📚 Навчання (Learning)
3. 💼 Робота (Work)
4. 🏠 Побут (Household)
5. 🎨 Творчість (Creativity)
6. ❤️ Здоров'я (Health)
7. 💰 Фінанси (Finance)
8. 👥 Соціальне (Social)

**Прогресія:**
- Кожна навичка має рівні 1-50
- Автоматичне нарахування skill XP при виконанні завдань
- XP = 50% від task XP
- Level up: skill_xp >= skill_level × 100
- Візуальні progress bars
- Skill badges та titles

---

### 6. Магазин Мантр

**3 Категорії Мантр:**

**🧠 Мантри Сили (Stats Boost):**
1. "Я зібраний. Я тримаю напрям." - +5% до характеристик (100 монет)
2. "Моя воля сильніша за опір." - +10% до характеристик (200 монет)
3. "Я — джерело сили. Вона в мені." - +15% до характеристик (300 монет)

**🪙 Мантри Достатку (Coins Boost):**
1. "Я дозволяю собі отримувати." - +5% до монет (100 монет)
2. "Мої дії винагороджуються." - +10% до монет (200 монет)
3. "Я в потоці обміну з життям." - +15% до монет (300 монет)

**✨ Мантри Досвіду (XP Boost):**
1. "Кожен крок робить мене майстром." - +5% до XP (100 монет)
2. "Я швидко вчуся і глибоко інтегрую." - +10% до XP (200 монет)
3. "Моє життя — шлях зростання." - +15% до XP (300 монет)

**Механіка:**
- Покупка за монети
- Система інвентарю
- Екіпірування через dropdown меню (Sparkles icon)
- Активна мантра показується з галочкою
- Ефекти автоматично застосовуються при виконанні завдань

---

### 7. Кастомні Винагороди

**Функції:**
- Створення власних винагород
- Поля:
  - Назва
  - Опис
  - Зображення (завантаження фото)
  - Необхідний рівень (1-100)
  - Вартість в монетах

**Система:**
- Покупка за зароблені монети
- Перевірки:
  - Рівень користувача >= необхідний рівень
  - Достатньо монет
  - Одноразова покупка
- Історія придбаних винагород
- Дарування винагород друзям
- Анімація конфетті при покупці

**Приклади:**
- "Піца з друзями" - 500 монет, рівень 5
- "Новий гаджет" - 2000 монет, рівень 15
- "Вихідний день" - 1000 монет, рівень 10

---

### 8. Система Друзів

**Функції:**
- Пошук друзів по email
- Інтерактивний preview профілю при пошуку:
  - Аватар
  - Ім'я персонажа
  - Email
  - Рівень
- Відправка запитів на дружбу
- Список друзів з аватарами
- Статуси: pending, accepted
- Кнопка "Написати" (для майбутніх повідомлень)

**Спільні Квести:**
- Можливість ділитися квестами
- Запрошення друзів в квести
- Спільний прогрес
- Команда учасників

---

### 9. Система Досягнень

**Типи:**

**Progression:**
- "Перші кроки" - виконай перше завдання
- "Новачок" - досягни 5 рівня
- "Досвідчений" - досягни 10 рівня
- "Майстер" - досягни 25 рівня
- "Легенда" - досягни 100 рівня

**Tasks:**
- "Продуктивний день" - 10 завдань за день
- "Тижневий герой" - всі daily tasks 7 днів
- "Трудівник" - 50 завдань
- "Завершувач" - 100 завдань

**Skills:**
- "Атлет" - Fitness level 10
- "Ерудит" - Learning level 10
- "Майстер на всі руки" - всі skills level 5

**Механіка:**
- Автоматична перевірка після кожної дії
- Анімовані сповіщення
- Бонусні XP та монети
- Унікальні titles

---

### 10. Аналітика та Статистика

**Метрики:**
- Загальна кількість завдань
- Виконані завдання
- Відсоток виконання
- XP та рівень прогресії
- Баланс монет
- Кількість звичок
- Виконані квести

**Візуалізація:**
- Графіки продуктивності (Recharts)
- Календар-heatmap активності
- Skill radar chart
- XP progression chart
- Task completion trends

---

## Database Schema

### Collections:

**users:**
```javascript
{
  id: UUID,
  email: String,
  passwordHash: String,
  character: {
    name: String,
    level: Number,
    xp: Number,
    xpToNextLevel: Number,
    coins: Number,
    hp: Number,
    maxHp: Number,
    stats: {
      strength: Number,
      intelligence: Number,
      stamina: Number,
      agility: Number,
      creativity: Number,
      charisma: Number
    },
    skills: {
      fitness: {level: Number, xp: Number},
      learning: {level: Number, xp: Number},
      // ... інші навички
    },
    availableStatPoints: Number,
    avatar: String (base64),
    title: String,
    equippedItem: String,
    age: Number,
    bio: String,
    globalGoals: [String]
  },
  inventory: [String],
  theme: String,
  createdAt: DateTime,
  lastLogin: DateTime
}
```

**tasks:**
```javascript
{
  id: UUID,
  userId: UUID,
  title: String,
  description: String,
  type: String, // daily, habit, todo, quest_step
  difficulty: String, // easy, medium, hard, very_hard
  xpReward: Number,
  coinReward: Number,
  skills: [String],
  tags: [String],
  priority: String,
  dueDate: DateTime,
  completed: Boolean,
  completedAt: DateTime,
  streak: Number,
  createdAt: DateTime
}
```

**habits:**
```javascript
{
  id: UUID,
  userId: UUID,
  name: String,
  description: String,
  type: String, // good, bad
  frequency: String,
  streak: Number,
  bestStreak: Number,
  lastCompleted: Date,
  completionDates: [Date],
  xpReward: Number,
  coinReward: Number,
  createdAt: DateTime
}
```

**quests:**
```javascript
{
  id: UUID,
  userId: UUID,
  title: String,
  description: String,
  difficulty: String,
  reward: String, // Кастомна текстова винагорода
  steps: [{
    id: UUID,
    title: String,
    description: String,
    completed: Boolean
  }],
  currentStep: Number,
  xpReward: Number,
  coinReward: Number,
  completed: Boolean,
  createdAt: DateTime
}
```

**achievements:**
```javascript
{
  id: UUID,
  userId: UUID,
  achievementId: String,
  title: String,
  description: String,
  xpReward: Number,
  coinReward: Number,
  unlockedAt: DateTime
}
```

**rewards:**
```javascript
{
  id: UUID,
  userId: UUID,
  name: String,
  description: String,
  image: String (base64),
  requiredLevel: Number,
  cost: Number,
  purchased: Boolean,
  purchasedAt: DateTime,
  createdAt: DateTime
}
```

**friends:**
```javascript
{
  id: UUID,
  userId: UUID,
  friendId: UUID,
  friendEmail: String,
  friendName: String,
  status: String, // pending, accepted
  createdAt: DateTime
}
```

**shared_quests:**
```javascript
{
  id: UUID,
  questId: UUID,
  ownerId: UUID,
  participants: [UUID],
  createdAt: DateTime
}
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - реєстрація з ім'ям персонажа
- `POST /api/auth/login` - вхід (JWT token)

### User Management
- `GET /api/user/me` - інформація про користувача
- `POST /api/user/allocate-stats` - розподіл характеристик
- `POST /api/user/theme` - зміна теми
- `POST /api/user/avatar` - завантаження аватара
- `POST /api/user/profile` - оновлення профілю (вік, біо, цілі)
- `GET /api/user/inventory` - інвентар мантр
- `POST /api/user/equip/{item_id}` - озброїти мантру

### Tasks
- `GET /api/tasks` - список завдань
- `POST /api/tasks` - створення завдання
- `POST /api/tasks/{id}/complete` - виконання завдання
- `DELETE /api/tasks/{id}` - видалення завдання
- `GET /api/tasks/archive` - архів виконаних

### Habits
- `GET /api/habits` - список звичок
- `POST /api/habits` - створення звички
- `POST /api/habits/{id}/track` - відмітити звичку
- `DELETE /api/habits/{id}` - видалення звички

### Quests
- `GET /api/quests` - список квестів
- `POST /api/quests` - створення квесту
- `POST /api/quests/{id}/next-step` - виконати крок
- `DELETE /api/quests/{id}` - видалення квесту
- `GET /api/quests/archive` - архів виконаних
- `POST /api/quests/{id}/share` - поділитися квестом
- `GET /api/quests/shared` - спільні квести

### Shop/Mantras
- `GET /api/shop/items` - список мантр
- `POST /api/shop/purchase/{id}` - купити мантру

### Rewards
- `GET /api/rewards` - список винагород
- `POST /api/rewards` - створити винагороду
- `POST /api/rewards/{id}/purchase` - купити винагороду
- `DELETE /api/rewards/{id}` - видалити винагороду
- `POST /api/rewards/gift` - подарувати винагороду

### Friends
- `GET /api/users/search?email=` - пошук користувача
- `POST /api/friends/add` - додати друга
- `GET /api/friends` - список друзів
- `POST /api/friends/{id}/accept` - прийняти запит

### Analytics
- `GET /api/stats/overview` - загальна статистика
- `GET /api/stats/analytics` - детальна аналітика
- `GET /api/achievements` - список досягнень

### Daily Challenges
- `GET /api/challenges/today` - сьогоднішній виклик
- `POST /api/challenges/complete` - виконати виклик

### Leaderboards
- `GET /api/leaderboards/{type}` - лідерборди (xp, tasks)

---

## Frontend Routes

- `/` - Dashboard (головна сторінка)
- `/auth` - Реєстрація/Вхід
- `/profile` - Профіль користувача
- `/friends` - Друзі

### Dashboard Tabs:
- **Завдання** - список активних завдань
- **Звички** - трекер звичок
- **Квести** - багатокрокові квести
- **Винагороди** - кастомні винагороди
- **Магазин** - покупка мантр

---

## UI/UX Дизайн

### Кольорова Палітра:
- **Primary**: #6C63FF → #4834DF (фіолетово-синій градієнт)
- **Secondary**: #2ECC71 (зелений для успіху)
- **Accent Gold**: #FFD700 → #FFA500 (золотий для XP/монет)
- **Accent Red**: #E74C3C (червоний для небезпеки)
- **Background Dark**: #0B0C15
- **Card Dark**: #151621
- **Text Primary**: #FFFFFF
- **Text Secondary**: #A0AEC0

### Шрифти:
- **Заголовки**: Exo 2 (sci-fi/RPG стиль)
- **Текст**: Rubik (читабельність, підтримка кирилиці)

### Анімації:
- Level up celebration (повноекранна з конфетті)
- Achievement unlock popup
- XP bar smooth transitions
- Task completion effects
- Confetti при покупці винагород

### Компоненти:
- Shadcn/UI (button, card, input, dropdown, tabs, etc.)
- Custom components (CharacterCard, TaskList, QuestsManager, etc.)
- Framer Motion для smooth animations
- Canvas Confetti для святкувань

---

## Ключові Механіки

### 1. Level Up System
```javascript
// XP для наступного рівня
XP_needed = 100 × current_level × 1.5

// При level up:
- level += 1
- availableStatPoints += 3
- Повноекранна анімація
- Звукові ефекти (опціонально)
```

### 2. HP System
```javascript
// При провалі шкідливої звички:
HP -= 15

// При HP = 0:
if (coins >= 1000) {
  level -= 2
  coins -= 1000
} else {
  level = 1
  coins = 0
}
HP = maxHP // Відновлення
```

### 3. Mantra Effects
```javascript
// При виконанні завдання:
if (equippedMantra) {
  if (effect === 'xp') {
    finalXP = taskXP × (1 + effectValue/100)
  }
  if (effect === 'coins') {
    finalCoins = taskCoins × (1 + effectValue/100)
  }
  if (effect === 'stats') {
    statsBonus = effectValue/100
  }
}
```

### 4. Skill Progression
```javascript
// При виконанні завдання з skill:
skillXP += taskXP × 0.5
xpNeeded = skillLevel × 100

if (skillXP >= xpNeeded) {
  skillLevel += 1
  skillXP -= xpNeeded
}
```

---

## Безпека

### Authentication:
- JWT токени з 30-денним терміном дії
- BCrypt для хешування паролів
- HTTP Bearer tokens
- Protected routes на frontend
- Middleware для перевірки токенів

### Validation:
- Pydantic models для backend
- Email validation
- Input sanitization
- CORS configuration

---

## Розгортання

### Environment Variables:

**Backend (.env):**
```
MONGO_URL=mongodb://...
DB_NAME=quest_manager
JWT_SECRET=your-secret-key
CORS_ORIGINS=*
```

**Frontend (.env):**
```
REACT_APP_BACKEND_URL=https://your-domain.com
```

### Services:
- Backend: FastAPI на порту 8001
- Frontend: React на порту 3000
- MongoDB: Окремий сервіс
- Supervisor для управління процесами

---

## Майбутні Покращення

1. **Звукові ефекти** для level up, досягнень, виконання завдань
2. **Push-сповіщення** для дедлайнів та викликів
3. **PWA підтримка** для мобільних пристроїв
4. **Експорт даних** (CSV/JSON)
5. **Інтеграція з календарем** (Google Calendar, Outlook)
6. **Pomodoro timer** для завдань
7. **AI-powered task suggestions** на базі історії
8. **Мультимовність** (англійська, інші мови)
9. **Boss battles** - великі виклики з особливими винагородами
10. **Pet/companion system** - віртуальні супутники
11. **Seasonal events** - святкові івенти з унікальними винагородами
12. **Customizable themes** - більше тем оформлення
13. **Voice commands** - голосове управління
14. **Social feed** - стрічка активності друзів

---

## Висновок

Quest Manager - це повноцінна екосистема для управління продуктивністю через геймифікацію. Додаток поєднує найкращі практики task management з захоплюючими елементами RPG-ігор, створюючи унікальний досвід, який мотивує користувачів досягати своїх цілей.

Всі функції розблоковані з 1-го рівня, що дозволяє користувачам одразу використовувати повний функціонал додатку. Система прогресу, винагород та соціальних елементів створює довгострокову мотивацію та залучення.

**Основні переваги:**
- ✅ Повна українізація
- ✅ Інтуїтивний інтерфейс
- ✅ Глибока система прогресу
- ✅ Соціальні функції
- ✅ Гнучка кастомізація
- ✅ Мотиваційні механіки
- ✅ Сучасний tech stack
- ✅ Масштабована архітектура

---

**Версія документації:** 1.0
**Дата оновлення:** 04.02.2026
**Підтримка:** Emergent Labs
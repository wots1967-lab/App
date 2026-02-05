from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta, date
import jwt
from passlib.context import CryptContext
import math
import random
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Utility Functions ---
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def calculate_xp_for_level(level: int) -> int:
    return math.floor(100 * level * 1.5)

def add_xp(user_data: dict, xp: int) -> tuple[dict, bool]:
    leveled_up = False
    user_data['character']['xp'] += xp
    while user_data['character']['xp'] >= user_data['character']['xpToNextLevel']:
        user_data['character']['xp'] -= user_data['character']['xpToNextLevel']
        user_data['character']['level'] += 1
        user_data['character']['availableStatPoints'] += 3
        user_data['character']['xpToNextLevel'] = calculate_xp_for_level(user_data['character']['level'])
        leveled_up = True
    return user_data, leveled_up

async def check_and_unlock_achievements(user_id: str):
    """Check and unlock achievements based on user progress"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return []
    
    unlocked = []
    
    # Get user stats
    total_tasks = await db.tasks.count_documents({"userId": user_id})
    completed_tasks = await db.tasks.count_documents({"userId": user_id, "completed": True})
    level = user['character']['level']
    
    # Define achievements
    achievements_to_check = [
        {"id": "first_task", "title": "Перші кроки", "description": "Виконай перше завдання", "condition": completed_tasks >= 1, "xp": 50, "coins": 25},
        {"id": "level_5", "title": "Новачок", "description": "Досягни 5 рівня", "condition": level >= 5, "xp": 100, "coins": 50},
        {"id": "level_10", "title": "Досвідчений", "description": "Досягни 10 рівня", "condition": level >= 10, "xp": 200, "coins": 100},
        {"id": "level_25", "title": "Майстер", "description": "Досягни 25 рівня", "condition": level >= 25, "xp": 500, "coins": 250},
        {"id": "tasks_10", "title": "Продуктивний", "description": "Виконай 10 завдань", "condition": completed_tasks >= 10, "xp": 100, "coins": 50},
        {"id": "tasks_50", "title": "Трудівник", "description": "Виконай 50 завдань", "condition": completed_tasks >= 50, "xp": 300, "coins": 150},
        {"id": "tasks_100", "title": "Завершувач", "description": "Виконай 100 завдань", "condition": completed_tasks >= 100, "xp": 500, "coins": 250},
    ]
    
    for achievement_data in achievements_to_check:
        if achievement_data['condition']:
            # Check if already unlocked
            existing = await db.achievements.find_one({
                "userId": user_id,
                "achievementId": achievement_data['id']
            }, {"_id": 0})
            
            if not existing:
                # Unlock achievement
                achievement = {
                    "id": str(uuid.uuid4()),
                    "userId": user_id,
                    "achievementId": achievement_data['id'],
                    "title": achievement_data['title'],
                    "description": achievement_data['description'],
                    "xpReward": achievement_data['xp'],
                    "coinReward": achievement_data['coins'],
                    "unlockedAt": datetime.now(timezone.utc).isoformat()
                }
                await db.achievements.insert_one(achievement)
                
                # Award rewards
                await db.users.update_one(
                    {"id": user_id},
                    {"$inc": {
                        "character.coins": achievement_data['coins']
                    }}
                )
                
                # Remove MongoDB _id before returning
                achievement.pop('_id', None)
                unlocked.append(achievement)
    
    return unlocked

# --- Auth Dependency ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# --- Models ---
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    characterName: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]

class Stats(BaseModel):
    strength: int = 0
    intelligence: int = 0
    stamina: int = 0
    agility: int = 0
    creativity: int = 0
    charisma: int = 0

class Skills(BaseModel):
    fitness: Dict[str, int] = {"level": 1, "xp": 0}
    learning: Dict[str, int] = {"level": 1, "xp": 0}
    work: Dict[str, int] = {"level": 1, "xp": 0}
    household: Dict[str, int] = {"level": 1, "xp": 0}
    creativity: Dict[str, int] = {"level": 1, "xp": 0}
    health: Dict[str, int] = {"level": 1, "xp": 0}
    finance: Dict[str, int] = {"level": 1, "xp": 0}
    social: Dict[str, int] = {"level": 1, "xp": 0}

class Character(BaseModel):
    name: str
    level: int = 1
    xp: int = 0
    xpToNextLevel: int = 150
    coins: int = 0
    stats: Stats = Field(default_factory=Stats)
    skills: Skills = Field(default_factory=Skills)
    availableStatPoints: int = 0
    avatar: str = ""
    title: str = "Новачок"
    hp: int = 100
    maxHp: int = 100
    equippedItem: Optional[str] = None
    age: Optional[int] = None
    bio: str = ""
    globalGoals: List[str] = Field(default_factory=list)

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    character: Character
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    lastLogin: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    theme: str = "dark"

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    title: str
    description: str = ""
    type: str = "daily"
    difficulty: str = "medium"
    xpReward: int = 35
    coinReward: int = 25
    skills: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    priority: str = "medium"
    dueDate: Optional[str] = None
    completed: bool = False
    completedAt: Optional[str] = None
    streak: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    type: str = "daily"
    difficulty: str = "medium"
    skills: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    priority: str = "medium"
    dueDate: Optional[str] = None

class Habit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    name: str
    description: str = ""
    type: str = "good"
    frequency: str = "daily"
    streak: int = 0
    bestStreak: int = 0
    lastCompleted: Optional[str] = None
    completionDates: List[str] = Field(default_factory=list)
    xpReward: int = 20
    coinReward: int = 15
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HabitCreate(BaseModel):
    name: str
    description: str = ""
    type: str = "good"
    frequency: str = "daily"

class QuestStep(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    completed: bool = False

class Quest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    title: str
    description: str = ""
    difficulty: str = "medium"
    reward: str = ""
    steps: List[QuestStep] = Field(default_factory=list)
    currentStep: int = 0
    xpReward: int = 200
    coinReward: int = 100
    completed: bool = False
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuestCreate(BaseModel):
    title: str
    description: str = ""
    difficulty: str = "medium"
    reward: str = ""
    steps: List[Dict[str, str]]

class Goal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    title: str
    description: str = ""
    type: str = "short_term"
    deadline: Optional[str] = None
    progress: int = 0
    target: int = 100
    completed: bool = False
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GoalCreate(BaseModel):
    title: str
    description: str = ""
    type: str = "short_term"
    deadline: Optional[str] = None
    target: int = 100

class AllocateStatsRequest(BaseModel):
    stats: Dict[str, int]

class UpdateThemeRequest(BaseModel):
    theme: str

class UpdateAvatarRequest(BaseModel):
    avatar: str

class ShopItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    type: str
    effect: str
    effectValue: int
    price: int
    icon: str

class UpdateProfileRequest(BaseModel):
    age: Optional[int] = None
    bio: Optional[str] = None
    globalGoals: Optional[List[str]] = None

class Friend(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    friendId: str
    friendEmail: str
    friendName: str
    status: str = "pending"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AddFriendRequest(BaseModel):
    friendEmail: EmailStr

class Reward(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    name: str
    description: str = ""
    image: str = ""
    requiredLevel: int = 1
    cost: int
    purchased: bool = False
    purchasedAt: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RewardCreate(BaseModel):
    name: str
    description: str = ""
    image: str = ""
    requiredLevel: int = 1
    cost: int

# --- Auth Routes ---
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    existing = await db.users.find_one({"email": req.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    character = Character(name=req.characterName)
    user = User(email=req.email, character=character)
    user_dict = user.model_dump()
    user_dict['passwordHash'] = hash_password(req.password)
    user_dict['createdAt'] = user_dict['createdAt'].isoformat()
    user_dict['lastLogin'] = user_dict['lastLogin'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    token = create_access_token(data={"sub": user.id})
    user_response = user.model_dump()
    return {"token": token, "user": user_response}

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user or not verify_password(req.password, user['passwordHash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    await db.users.update_one(
        {"id": user['id']},
        {"$set": {"lastLogin": datetime.now(timezone.utc).isoformat()}}
    )
    
    token = create_access_token(data={"sub": user['id']})
    user.pop('passwordHash', None)
    return {"token": token, "user": user}

# --- User Routes ---
@api_router.get("/user/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    current_user.pop('passwordHash', None)
    return current_user

@api_router.post("/user/allocate-stats")
async def allocate_stats(req: AllocateStatsRequest, current_user: dict = Depends(get_current_user)):
    total_points = sum(req.stats.values())
    if total_points > current_user['character']['availableStatPoints']:
        raise HTTPException(status_code=400, detail="Not enough stat points")
    
    for stat, value in req.stats.items():
        if stat in current_user['character']['stats']:
            current_user['character']['stats'][stat] += value
    
    current_user['character']['availableStatPoints'] -= total_points
    
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"character": current_user['character']}}
    )
    
    return current_user['character']

@api_router.post("/user/theme")
async def update_theme(req: UpdateThemeRequest, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"theme": req.theme}}
    )
    return {"theme": req.theme}

@api_router.post("/user/avatar")
async def update_avatar(req: UpdateAvatarRequest, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"character.avatar": req.avatar}}
    )
    return {"avatar": req.avatar}

# --- Task Routes ---
@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(current_user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"userId": current_user['id']}, {"_id": 0}).to_list(1000)
    return tasks

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    rewards = {
        "easy": {"xp": 15, "coins": 10},
        "medium": {"xp": 35, "coins": 25},
        "hard": {"xp": 75, "coins": 50},
        "very_hard": {"xp": 150, "coins": 100}
    }
    reward = rewards.get(task_data.difficulty, rewards["medium"])
    
    task = Task(
        userId=current_user['id'],
        title=task_data.title,
        description=task_data.description,
        type=task_data.type,
        difficulty=task_data.difficulty,
        xpReward=reward['xp'],
        coinReward=reward['coins'],
        skills=task_data.skills,
        tags=task_data.tags,
        priority=task_data.priority,
        dueDate=task_data.dueDate
    )
    
    task_dict = task.model_dump()
    task_dict['createdAt'] = task_dict['createdAt'].isoformat()
    
    await db.tasks.insert_one(task_dict)
    return task

@api_router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id, "userId": current_user['id']}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task['completed']:
        raise HTTPException(status_code=400, detail="Task already completed")
    
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {"completed": True, "completedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    user['character']['coins'] += task['coinReward']
    
    old_level = user['character']['level']
    user, leveled_up = add_xp(user, task['xpReward'])
    new_level = user['character']['level']
    
    # Add skill XP
    for skill in task['skills']:
        if skill in user['character']['skills']:
            skill_xp = task['xpReward'] // 2
            user['character']['skills'][skill]['xp'] += skill_xp
            xp_needed = user['character']['skills'][skill]['level'] * 100
            if user['character']['skills'][skill]['xp'] >= xp_needed:
                user['character']['skills'][skill]['level'] += 1
                user['character']['skills'][skill]['xp'] -= xp_needed
    
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"character": user['character']}}
    )
    
    # Check achievements
    new_achievements = await check_and_unlock_achievements(current_user['id'])
    
    return {
        "task": task,
        "character": user['character'],
        "leveledUp": leveled_up,
        "oldLevel": old_level,
        "newLevel": new_level,
        "achievements": new_achievements
    }

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id, "userId": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# --- Habit Routes ---
@api_router.get("/habits")
async def get_habits(current_user: dict = Depends(get_current_user)):
    habits = await db.habits.find({"userId": current_user['id']}, {"_id": 0}).to_list(1000)
    return habits

@api_router.post("/habits")
async def create_habit(habit_data: HabitCreate, current_user: dict = Depends(get_current_user)):
    habit = Habit(
        userId=current_user['id'],
        name=habit_data.name,
        description=habit_data.description,
        type=habit_data.type,
        frequency=habit_data.frequency
    )
    
    habit_dict = habit.model_dump()
    habit_dict['createdAt'] = habit_dict['createdAt'].isoformat()
    await db.habits.insert_one(habit_dict)
    return habit

@api_router.post("/habits/{habit_id}/track")
async def track_habit(habit_id: str, current_user: dict = Depends(get_current_user)):
    habit = await db.habits.find_one({"id": habit_id, "userId": current_user['id']}, {"_id": 0})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    today = date.today().isoformat()
    
    if today in habit.get('completionDates', []):
        raise HTTPException(status_code=400, detail="Habit already tracked today")
    
    completion_dates = habit.get('completionDates', [])
    completion_dates.append(today)
    
    last_completed = habit.get('lastCompleted')
    if last_completed:
        last_date = date.fromisoformat(last_completed)
        if (date.today() - last_date).days == 1:
            habit['streak'] += 1
        else:
            habit['streak'] = 1
    else:
        habit['streak'] = 1
    
    habit['bestStreak'] = max(habit.get('bestStreak', 0), habit['streak'])
    habit['lastCompleted'] = today
    
    await db.habits.update_one(
        {"id": habit_id},
        {"$set": {
            "streak": habit['streak'],
            "bestStreak": habit['bestStreak'],
            "lastCompleted": today,
            "completionDates": completion_dates
        }}
    )
    
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    
    # Check habit type for HP/rewards
    if habit.get('type') == 'bad':
        # Bad habit - lose HP
        user['character']['hp'] = max(0, user['character']['hp'] - 15)
        
        # Check if HP is 0 - apply penalty
        if user['character']['hp'] == 0:
            user['character']['level'] = max(1, user['character']['level'] - 2)
            user['character']['coins'] = max(0, user['character']['coins'] - 1000)
            user['character']['hp'] = user['character']['maxHp']
            user['character']['xpToNextLevel'] = calculate_xp_for_level(user['character']['level'])
            penalty_applied = True
        else:
            penalty_applied = False
    else:
        # Good habit - gain rewards
        user['character']['coins'] += habit['coinReward']
        user, leveled_up = add_xp(user, habit['xpReward'])
        penalty_applied = False
    
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"character": user['character']}}
    )
    
    return {
        "habit": habit,
        "character": user['character'],
        "leveledUp": leveled_up if habit.get('type') != 'bad' else False,
        "penaltyApplied": penalty_applied
    }

@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.habits.delete_one({"id": habit_id, "userId": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    return {"message": "Habit deleted"}

# --- Quest Routes ---
@api_router.get("/quests")
async def get_quests(current_user: dict = Depends(get_current_user)):
    quests = await db.quests.find({"userId": current_user['id']}, {"_id": 0}).to_list(1000)
    return quests

@api_router.post("/quests")
async def create_quest(quest_data: QuestCreate, current_user: dict = Depends(get_current_user)):
    rewards = {
        "easy": {"xp": 100, "coins": 50},
        "medium": {"xp": 200, "coins": 100},
        "hard": {"xp": 500, "coins": 250}
    }
    reward = rewards.get(quest_data.difficulty, rewards["medium"])
    
    steps = [QuestStep(title=step['title'], description=step.get('description', '')) for step in quest_data.steps]
    
    quest = Quest(
        userId=current_user['id'],
        title=quest_data.title,
        description=quest_data.description,
        difficulty=quest_data.difficulty,
        reward=quest_data.reward,
        steps=steps,
        xpReward=reward['xp'],
        coinReward=reward['coins']
    )
    
    quest_dict = quest.model_dump()
    quest_dict['createdAt'] = quest_dict['createdAt'].isoformat()
    await db.quests.insert_one(quest_dict)
    return quest

@api_router.post("/quests/{quest_id}/next-step")
async def complete_quest_step(quest_id: str, current_user: dict = Depends(get_current_user)):
    quest = await db.quests.find_one({"id": quest_id, "userId": current_user['id']}, {"_id": 0})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    if quest['completed']:
        raise HTTPException(status_code=400, detail="Quest already completed")
    
    if quest['currentStep'] >= len(quest['steps']):
        raise HTTPException(status_code=400, detail="All steps completed")
    
    quest['steps'][quest['currentStep']]['completed'] = True
    quest['currentStep'] += 1
    
    quest_completed = quest['currentStep'] >= len(quest['steps'])
    if quest_completed:
        quest['completed'] = True
    
    await db.quests.update_one(
        {"id": quest_id},
        {"$set": {
            "steps": quest['steps'],
            "currentStep": quest['currentStep'],
            "completed": quest_completed
        }}
    )
    
    if quest_completed:
        user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
        user['character']['coins'] += quest['coinReward']
        user, leveled_up = add_xp(user, quest['xpReward'])
        
        await db.users.update_one(
            {"id": current_user['id']},
            {"$set": {"character": user['character']}}
        )
        
        return {"quest": quest, "character": user['character'], "leveledUp": leveled_up}
    
    return {"quest": quest}

@api_router.delete("/quests/{quest_id}")
async def delete_quest(quest_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.quests.delete_one({"id": quest_id, "userId": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quest not found")
    return {"message": "Quest deleted"}

# --- Achievement Routes ---
@api_router.get("/achievements")
async def get_achievements(current_user: dict = Depends(get_current_user)):
    achievements = await db.achievements.find({"userId": current_user['id']}, {"_id": 0}).to_list(1000)
    return achievements

# --- Goal Routes ---
@api_router.get("/goals")
async def get_goals(current_user: dict = Depends(get_current_user)):
    goals = await db.goals.find({"userId": current_user['id']}, {"_id": 0}).to_list(1000)
    return goals

@api_router.post("/goals")
async def create_goal(goal_data: GoalCreate, current_user: dict = Depends(get_current_user)):
    goal = Goal(
        userId=current_user['id'],
        title=goal_data.title,
        description=goal_data.description,
        type=goal_data.type,
        deadline=goal_data.deadline,
        target=goal_data.target
    )
    
    goal_dict = goal.model_dump()
    goal_dict['createdAt'] = goal_dict['createdAt'].isoformat()
    await db.goals.insert_one(goal_dict)
    return goal

@api_router.patch("/goals/{goal_id}/progress")
async def update_goal_progress(goal_id: str, progress: int, current_user: dict = Depends(get_current_user)):
    goal = await db.goals.find_one({"id": goal_id, "userId": current_user['id']}, {"_id": 0})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goal['progress'] = min(progress, goal['target'])
    goal['completed'] = goal['progress'] >= goal['target']
    
    await db.goals.update_one(
        {"id": goal_id},
        {"$set": {"progress": goal['progress'], "completed": goal['completed']}}
    )
    
    return goal

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.goals.delete_one({"id": goal_id, "userId": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}

# --- Stats Routes ---
@api_router.get("/stats/overview")
async def get_stats_overview(current_user: dict = Depends(get_current_user)):
    total_tasks = await db.tasks.count_documents({"userId": current_user['id']})
    completed_tasks = await db.tasks.count_documents({"userId": current_user['id'], "completed": True})
    total_habits = await db.habits.count_documents({"userId": current_user['id']})
    total_quests = await db.quests.count_documents({"userId": current_user['id']})
    completed_quests = await db.quests.count_documents({"userId": current_user['id'], "completed": True})
    
    return {
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "totalHabits": total_habits,
        "totalQuests": total_quests,
        "completedQuests": completed_quests,
        "level": current_user['character']['level'],
        "xp": current_user['character']['xp'],
        "coins": current_user['character']['coins']
    }

@api_router.get("/stats/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    # Get completed tasks grouped by date
    completed = await db.tasks.find(
        {"userId": current_user['id'], "completed": True},
        {"_id": 0, "completedAt": 1}
    ).to_list(1000)
    
    # Daily activity
    daily_activity = {}
    for task in completed:
        if task.get('completedAt'):
            day = task['completedAt'][:10]
            daily_activity[day] = daily_activity.get(day, 0) + 1
    
    return {
        "dailyActivity": daily_activity,
        "skills": current_user['character']['skills']
    }

# --- Daily Challenge Routes ---
@api_router.get("/challenges/today")
async def get_daily_challenge(current_user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    
    challenge = await db.daily_challenges.find_one({
        "userId": current_user['id'],
        "date": today
    }, {"_id": 0})
    
    if not challenge:
        # Generate new challenge
        challenges = [
            {"type": "tasks", "title": "Виконай 5 завдань сьогодні", "target": 5, "reward_xp": 50, "reward_coins": 30},
            {"type": "habits", "title": "Підтримай всі звички", "target": 3, "reward_xp": 40, "reward_coins": 25},
            {"type": "xp", "title": "Заробіт 100 XP", "target": 100, "reward_xp": 100, "reward_coins": 50},
            {"type": "skills", "title": "Прокачай будь-яку навичку", "target": 1, "reward_xp": 30, "reward_coins": 20},
        ]
        
        selected = random.choice(challenges)
        challenge = {
            "id": str(uuid.uuid4()),
            "userId": current_user['id'],
            "date": today,
            "type": selected['type'],
            "title": selected['title'],
            "target": selected['target'],
            "progress": 0,
            "completed": False,
            "rewardXp": selected['reward_xp'],
            "rewardCoins": selected['reward_coins']
        }
        await db.daily_challenges.insert_one(challenge)
    
    return challenge

@api_router.post("/challenges/complete")
async def complete_daily_challenge(current_user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    
    challenge = await db.daily_challenges.find_one({
        "userId": current_user['id'],
        "date": today,
        "completed": False
    }, {"_id": 0})
    
    if not challenge:
        raise HTTPException(status_code=404, detail="No active challenge found")
    
    if challenge['progress'] >= challenge['target']:
        await db.daily_challenges.update_one(
            {"id": challenge['id']},
            {"$set": {"completed": True}}
        )
        
        user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
        user['character']['coins'] += challenge['rewardCoins']
        user, leveled_up = add_xp(user, challenge['rewardXp'])
        
        await db.users.update_one(
            {"id": current_user['id']},
            {"$set": {"character": user['character']}}
        )
        
        return {"challenge": challenge, "character": user['character'], "leveledUp": leveled_up}
    
    raise HTTPException(status_code=400, detail="Challenge not completed yet")

# --- Profile Routes ---
@api_router.post("/user/profile")
async def update_profile(req: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    update_data = {}
    if req.age is not None:
        update_data["character.age"] = req.age
    if req.bio is not None:
        update_data["character.bio"] = req.bio
    if req.globalGoals is not None:
        update_data["character.globalGoals"] = req.globalGoals
    
    if update_data:
        await db.users.update_one(
            {"id": current_user['id']},
            {"$set": update_data}
        )
    
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    user.pop('passwordHash', None)
    return user

# --- Shop/Items Routes ---
@api_router.get("/shop/items")
async def get_shop_items():
    items = [
        # Мантри Сили
        {"id": "mantra_strength_1", "name": "Я зібраний. Я тримаю напрям.", "category": "strength", "description": "Коли розум не розпорошений, навіть мала дія має вагу.", "type": "boost", "effect": "stats", "effectValue": 5, "price": 100, "icon": "🧠"},
        {"id": "mantra_strength_2", "name": "Моя воля сильніша за опір.", "category": "strength", "description": "Ти не борешся з труднощами. Ти їх переварюєш.", "type": "boost", "effect": "stats", "effectValue": 10, "price": 200, "icon": "🧠"},
        {"id": "mantra_strength_3", "name": "Я — джерело сили. Вона в мені.", "category": "strength", "description": "Стан внутрішнього ядра. Сила стає фоном, а не зусиллям.", "type": "boost", "effect": "stats", "effectValue": 15, "price": 300, "icon": "🧠"},
        
        # Мантри Достатку
        {"id": "mantra_coins_1", "name": "Я дозволяю собі отримувати.", "category": "wealth", "description": "Достаток починається з дозволу, а не з боротьби.", "type": "boost", "effect": "coins", "effectValue": 5, "price": 100, "icon": "🪙"},
        {"id": "mantra_coins_2", "name": "Мої дії винагороджуються.", "category": "wealth", "description": "Світ відповідає на чіткі рухи.", "type": "boost", "effect": "coins", "effectValue": 10, "price": 200, "icon": "🪙"},
        {"id": "mantra_coins_3", "name": "Я в потоці обміну з життям.", "category": "wealth", "description": "Ти не накопичуєш. Ти циркулюєш — і тому маєш більше.", "type": "boost", "effect": "coins", "effectValue": 15, "price": 300, "icon": "🪙"},
        
        # Мантри Досвіду
        {"id": "mantra_xp_1", "name": "Кожен крок робить мене майстром.", "category": "experience", "description": "Навіть буденне стає навчанням.", "type": "boost", "effect": "xp", "effectValue": 5, "price": 100, "icon": "✨"},
        {"id": "mantra_xp_2", "name": "Я швидко вчуся і глибоко інтегрую.", "category": "experience", "description": "Не кількість спроб, а якість засвоєння.", "type": "boost", "effect": "xp", "effectValue": 10, "price": 200, "icon": "✨"},
        {"id": "mantra_xp_3", "name": "Моє життя — шлях зростання.", "category": "experience", "description": "Будь-який досвід працює на тебе. Навіть складний.", "type": "boost", "effect": "xp", "effectValue": 15, "price": 300, "icon": "✨"},
    ]
    return items

@api_router.post("/shop/purchase/{item_id}")
async def purchase_item(item_id: str, current_user: dict = Depends(get_current_user)):
    # Get all items
    all_items = await get_shop_items()
    item = next((i for i in all_items if i['id'] == item_id), None)
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    if user['character']['coins'] < item['price']:
        raise HTTPException(status_code=400, detail="Not enough coins")
    
    user['character']['coins'] -= item['price']
    
    # Add item to inventory
    if 'inventory' not in user:
        user['inventory'] = []
    
    # Check if already owned
    if item_id not in user['inventory']:
        user['inventory'].append(item_id)
    
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"character.coins": user['character']['coins'], "inventory": user['inventory']}}
    )
    
    return {"message": f"Мантру придбано!", "character": user['character'], "inventory": user['inventory']}

@api_router.post("/user/equip/{item_id}")
async def equip_item(item_id: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    
    if item_id not in user.get('inventory', []):
        raise HTTPException(status_code=400, detail="Item not in inventory")
    
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"character.equippedItem": item_id}}
    )
    
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    return {"character": user['character']}

@api_router.get("/user/inventory")
async def get_inventory(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    inventory = user.get('inventory', [])
    
    # Get item details
    all_items = await get_shop_items()
    inventory_items = [item for item in all_items if item['id'] in inventory]
    
    return {
        "inventory": inventory_items,
        "equippedItem": user['character'].get('equippedItem')
    }

# --- Friends Routes ---
@api_router.get("/users/search")
async def search_user(email: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"email": email}, {"_id": 0, "passwordHash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user['id'],
        "email": user['email'],
        "character": {
            "name": user['character']['name'],
            "level": user['character']['level'],
            "avatar": user['character'].get('avatar', '')
        }
    }

@api_router.post("/friends/add")
async def add_friend(req: AddFriendRequest, current_user: dict = Depends(get_current_user)):
    # Find friend by email
    friend = await db.users.find_one({"email": req.friendEmail}, {"_id": 0})
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    
    if friend['id'] == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    # Check if already friends
    existing = await db.friends.find_one({
        "userId": current_user['id'],
        "friendId": friend['id']
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Already friends or request pending")
    
    # Create friend request
    friend_record = Friend(
        userId=current_user['id'],
        friendId=friend['id'],
        friendEmail=friend['email'],
        friendName=friend['character']['name']
    )
    
    friend_dict = friend_record.model_dump()
    friend_dict['createdAt'] = friend_dict['createdAt'].isoformat()
    await db.friends.insert_one(friend_dict)
    
    return friend_record

@api_router.get("/friends")
async def get_friends(current_user: dict = Depends(get_current_user)):
    friends = await db.friends.find({
        "userId": current_user['id'],
        "status": "accepted"
    }, {"_id": 0}).to_list(100)
    return friends

@api_router.post("/friends/{friend_id}/accept")
async def accept_friend(friend_id: str, current_user: dict = Depends(get_current_user)):
    await db.friends.update_one(
        {"id": friend_id, "friendId": current_user['id']},
        {"$set": {"status": "accepted"}}
    )
    return {"message": "Friend request accepted"}

# --- Archive Routes ---
@api_router.get("/tasks/archive")
async def get_archived_tasks(current_user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({
        "userId": current_user['id'],
        "completed": True
    }, {"_id": 0}).sort("completedAt", -1).to_list(1000)
    return tasks

@api_router.get("/quests/archive")
async def get_archived_quests(current_user: dict = Depends(get_current_user)):
    quests = await db.quests.find({
        "userId": current_user['id'],
        "completed": True
    }, {"_id": 0}).to_list(1000)
    return quests

# --- Rewards Routes ---
@api_router.get("/rewards")
async def get_rewards(current_user: dict = Depends(get_current_user)):
    rewards = await db.rewards.find({"userId": current_user['id']}, {"_id": 0}).to_list(1000)
    return rewards

@api_router.post("/rewards")
async def create_reward(reward_data: RewardCreate, current_user: dict = Depends(get_current_user)):
    reward = Reward(
        userId=current_user['id'],
        name=reward_data.name,
        description=reward_data.description,
        requiredLevel=reward_data.requiredLevel,
        cost=reward_data.cost
    )
    
    reward_dict = reward.model_dump()
    reward_dict['createdAt'] = reward_dict['createdAt'].isoformat()
    await db.rewards.insert_one(reward_dict)
    return reward

@api_router.post("/rewards/{reward_id}/purchase")
async def purchase_reward(reward_id: str, current_user: dict = Depends(get_current_user)):
    reward = await db.rewards.find_one({"id": reward_id, "userId": current_user['id']}, {"_id": 0})
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    if reward['purchased']:
        raise HTTPException(status_code=400, detail="Already purchased")
    
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    
    if user['character']['level'] < reward['requiredLevel']:
        raise HTTPException(status_code=400, detail="Level too low")
    
    if user['character']['coins'] < reward['cost']:
        raise HTTPException(status_code=400, detail="Not enough coins")
    
    user['character']['coins'] -= reward['cost']
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"character.coins": user['character']['coins']}}
    )
    
    await db.rewards.update_one(
        {"id": reward_id},
        {"$set": {"purchased": True}}
    )
    
    return {"message": "Reward purchased!", "character": user['character']}

@api_router.delete("/rewards/{reward_id}")
async def delete_reward(reward_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.rewards.delete_one({"id": reward_id, "userId": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reward not found")
    return {"message": "Reward deleted"}

# --- Leaderboard Routes ---
@api_router.get("/leaderboards/{board_type}")
async def get_leaderboard(board_type: str):
    if board_type == "xp":
        users = await db.users.find({}, {"_id": 0, "character.name": 1, "character.level": 1, "character.xp": 1}).sort("character.level", -1).limit(100).to_list(100)
        return [{"name": u['character']['name'], "level": u['character']['level'], "xp": u['character']['xp']} for u in users]
    elif board_type == "tasks":
        pipeline = [
            {"$group": {"_id": "$userId", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 100}
        ]
        results = await db.tasks.aggregate(pipeline).to_list(100)
        user_ids = [r['_id'] for r in results]
        users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "character.name": 1}).to_list(100)
        user_map = {u['id']: u['character']['name'] for u in users}
        return [{"name": user_map.get(r['_id'], "Unknown"), "count": r['count']} for r in results]
    
    return []

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

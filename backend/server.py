from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
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
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import math

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

def add_xp(user_data: dict, xp: int) -> dict:
    user_data['character']['xp'] += xp
    while user_data['character']['xp'] >= user_data['character']['xpToNextLevel']:
        user_data['character']['xp'] -= user_data['character']['xpToNextLevel']
        user_data['character']['level'] += 1
        user_data['character']['availableStatPoints'] += 3
        user_data['character']['xpToNextLevel'] = calculate_xp_for_level(user_data['character']['level'])
    return user_data

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

class Character(BaseModel):
    name: str
    level: int = 1
    xp: int = 0
    xpToNextLevel: int = 150
    coins: int = 0
    stats: Stats = Field(default_factory=Stats)
    availableStatPoints: int = 0
    avatar: str = "avatar_1"
    title: str = "Новачок"

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
    type: str = "daily"  # daily, habit, todo, quest_step
    difficulty: str = "medium"  # easy, medium, hard
    xpReward: int = 35
    coinReward: int = 25
    skills: List[str] = Field(default_factory=list)
    priority: str = "medium"  # low, medium, high, critical
    dueDate: Optional[str] = None
    completed: bool = False
    streak: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    type: str = "daily"
    difficulty: str = "medium"
    skills: List[str] = Field(default_factory=list)
    priority: str = "medium"
    dueDate: Optional[str] = None

class AllocateStatsRequest(BaseModel):
    stats: Dict[str, int]

class UpdateThemeRequest(BaseModel):
    theme: str

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
    
    # Update last login
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
    
    # Update stats
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

# --- Task Routes ---
@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(current_user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"userId": current_user['id']}, {"_id": 0}).to_list(1000)
    return tasks

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    # Calculate rewards based on difficulty
    rewards = {
        "easy": {"xp": 15, "coins": 10},
        "medium": {"xp": 35, "coins": 25},
        "hard": {"xp": 75, "coins": 50}
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
    
    # Mark task as completed
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {"completed": True}}
    )
    
    # Add XP and coins to user
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    user['character']['coins'] += task['coinReward']
    user = add_xp(user, task['xpReward'])
    
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"character": user['character']}}
    )
    
    return {
        "task": task,
        "character": user['character'],
        "leveledUp": user['character']['level'] > current_user['character']['level']
    }

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id, "userId": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# --- Stats Routes ---
@api_router.get("/stats/overview")
async def get_stats_overview(current_user: dict = Depends(get_current_user)):
    total_tasks = await db.tasks.count_documents({"userId": current_user['id']})
    completed_tasks = await db.tasks.count_documents({"userId": current_user['id'], "completed": True})
    
    return {
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "level": current_user['character']['level'],
        "xp": current_user['character']['xp'],
        "coins": current_user['character']['coins']
    }

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
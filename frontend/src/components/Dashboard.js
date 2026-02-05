import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CharacterCard from './CharacterCard';
import CharacterStats from './CharacterStats';
import TaskList from './TaskList';
import QuickAddTask from './QuickAddTask';
import StatsOverview from './StatsOverview';
import HabitsManager from './HabitsManager';
import QuestsManager from './QuestsManager';
import SkillsOverview from './SkillsOverview';
import ShopPage from './ShopPage';
import RewardsPage from './RewardsPage';
import LevelUpModal from './LevelUpModal';
import AchievementNotification from './AchievementNotification';
import EquipmentMenu from './EquipmentMenu';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LogOut, User, Lock, Users } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, token, logout, updateUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ oldLevel: 1, newLevel: 1 });
  const [achievement, setAchievement] = useState(null);

  const isUnlocked = user?.character?.level >= 3;

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
    // eslint-disable-next-line
  }, [token]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId) => {
    try {
      const response = await axios.post(
        `${API}/tasks/${taskId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = { ...user, character: response.data.character };
      updateUser(updatedUser);
      
      await fetchTasks();
      
      if (response.data.leveledUp) {
        setLevelUpData({
          oldLevel: response.data.oldLevel,
          newLevel: response.data.newLevel
        });
        setShowLevelUp(true);
      }
      
      if (response.data.achievements && response.data.achievements.length > 0) {
        setAchievement(response.data.achievements[0]);
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Помилка при виконанні завдання');
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const todayTasks = tasks.filter(task => !task.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-dark-card to-bg-dark">
      <LevelUpModal
        show={showLevelUp}
        oldLevel={levelUpData.oldLevel}
        newLevel={levelUpData.newLevel}
        onClose={() => setShowLevelUp(false)}
      />
      
      <AchievementNotification
        achievement={achievement}
        onClose={() => setAchievement(null)}
      />
      {/* Header */}
      <header className="border-b border-white/10 bg-bg-dark-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
            Quest Manager
          </h1>
          <div className="flex items-center gap-4">
            <EquipmentMenu />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/friends'}
              className="text-text-dark-secondary hover:text-text-dark-primary"
              data-testid="friends-button"
            >
              <Users size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/profile'}
              className="text-text-dark-secondary hover:text-text-dark-primary flex items-center gap-2"
              data-testid="profile-button"
            >
              {user?.character?.avatar ? (
                <img src={user.character.avatar} alt="Avatar" className="w-6 h-6 rounded-full" />
              ) : (
                <User size={20} />
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={logout}
              className="text-text-dark-secondary hover:text-red"
              data-testid="logout-button"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="bg-bg-dark-card border border-white/10">
            <TabsTrigger value="tasks" data-testid="tasks-tab">Завдання</TabsTrigger>
            <TabsTrigger value="habits" disabled={!isUnlocked} data-testid="habits-tab">
              Звички {!isUnlocked && <Lock size={14} className="ml-1" />}
            </TabsTrigger>
            <TabsTrigger value="quests" disabled={!isUnlocked} data-testid="quests-tab">
              Квести {!isUnlocked && <Lock size={14} className="ml-1" />}
            </TabsTrigger>
            <TabsTrigger value="shop" disabled={!isUnlocked} data-testid="shop-tab">
              Магазин {!isUnlocked && <Lock size={14} className="ml-1" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-6">
                <CharacterCard />
                <CharacterStats />
                <QuickAddTask onTaskAdded={fetchTasks} />
                <StatsOverview />
                {isUnlocked && <SkillsOverview />}
              </div>

              <div className="lg:col-span-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <TaskList
                    tasks={todayTasks}
                    loading={loading}
                    onTaskComplete={handleTaskComplete}
                    onTaskDelete={handleTaskDelete}
                  />
                </motion.div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="habits">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-6">
                <CharacterCard />
                <SkillsOverview />
              </div>
              <div className="lg:col-span-8">
                <HabitsManager />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quests">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-6">
                <CharacterCard />
                <SkillsOverview />
              </div>
              <div className="lg:col-span-8">
                <QuestsManager />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shop">
            <ShopPage />
          </TabsContent>
        </Tabs>

        {!isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gradient-to-r from-primary-main/20 to-primary-dark/20 border border-primary-main/50 rounded-lg p-6 text-center"
          >
            <Lock size={40} className="mx-auto mb-3 text-primary-main" />
            <h3 className="text-xl font-bold text-text-dark-primary mb-2">
              Розблокуйте більше функцій!
            </h3>
            <p className="text-text-dark-secondary">
              Досягніть <span className="text-primary-main font-bold">3-го рівня</span>, щоб розблокувати Звички, Квести, Навички, Досягнення та багато іншого!
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
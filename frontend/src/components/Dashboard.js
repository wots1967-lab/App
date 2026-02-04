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
import LevelUpModal from './LevelUpModal';
import AchievementNotification from './AchievementNotification';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LogOut, Moon, Sun, User, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, token, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

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
      
      // Update user character with new XP/coins
      const updatedUser = { ...user, character: response.data.character };
      updateUser(updatedUser);
      
      // Refresh tasks
      await fetchTasks();
      
      // Show level up notification if needed
      if (response.data.leveledUp) {
        // TODO: Show level up modal
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
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
      {/* Header */}
      <header className="border-b border-white/10 bg-bg-dark-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
            Quest Manager
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-text-dark-secondary hover:text-text-dark-primary"
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-text-dark-secondary hover:text-text-dark-primary"
            >
              <User size={20} />
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Character & Quick Add */}
          <div className="lg:col-span-4 space-y-6">
            <CharacterCard />
            <QuickAddTask onTaskAdded={fetchTasks} />
            <StatsOverview />
          </div>

          {/* Right Column - Tasks */}
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
      </main>
    </div>
  );
};

export default Dashboard;
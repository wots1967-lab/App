import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { TrendingUp, CheckCircle2, Trophy } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatsOverview = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return null;

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="stats-overview">
      <CardHeader>
        <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
          <Trophy size={20} className="text-accent-gold" />
          Статистика
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-dark-secondary">
            <CheckCircle2 size={16} className="text-secondary-main" />
            <span className="text-sm">Виконано</span>
          </div>
          <span className="text-text-dark-primary font-bold" data-testid="completed-tasks">
            {stats.completedTasks}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-dark-secondary">
            <TrendingUp size={16} className="text-primary-main" />
            <span className="text-sm">Відсоток виконання</span>
          </div>
          <span className="text-text-dark-primary font-bold" data-testid="completion-rate">
            {completionRate}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsOverview;
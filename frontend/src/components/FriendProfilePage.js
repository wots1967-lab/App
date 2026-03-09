import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  ChevronLeft, User, Target, Trophy, Gift, Compass, 
  Zap, Coins, Heart, Star, CheckCircle, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CARD_COLORS = {
  purple: { class: 'border-purple-500', bg: 'from-purple-500/20 to-purple-900/30' },
  blue: { class: 'border-blue-500', bg: 'from-blue-500/20 to-blue-900/30' },
  emerald: { class: 'border-emerald-500', bg: 'from-emerald-500/20 to-emerald-900/30' },
  amber: { class: 'border-amber-500', bg: 'from-amber-500/20 to-amber-900/30' },
  rose: { class: 'border-rose-500', bg: 'from-rose-500/20 to-rose-900/30' },
  slate: { class: 'border-slate-400', bg: 'from-slate-500/20 to-slate-900/30' },
  cyan: { class: 'border-cyan-500', bg: 'from-cyan-500/20 to-cyan-900/30' },
  orange: { class: 'border-orange-500', bg: 'from-orange-500/20 to-orange-900/30' },
};

const FriendProfilePage = () => {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFriendProfile();
    // eslint-disable-next-line
  }, [friendId]);

  const fetchFriendProfile = async () => {
    try {
      const response = await axios.get(`${API}/friends/${friendId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Помилка завантаження профілю');
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (colorId) => CARD_COLORS[colorId]?.class || 'border-purple-500';
  const getColorBg = (colorId) => CARD_COLORS[colorId]?.bg || 'from-purple-500/20 to-purple-900/30';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-dark-card to-bg-dark flex items-center justify-center">
        <div className="text-text-dark-secondary">Завантаження...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-dark-card to-bg-dark">
        <header className="border-b border-white/10 bg-bg-dark-card/50 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/friends')}>
              <ChevronLeft size={24} />
            </Button>
            <h1 className="text-xl font-bold text-text-dark-primary">Профіль друга</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-400">{error}</p>
          <Button onClick={() => navigate('/friends')} className="mt-4">
            Повернутися до друзів
          </Button>
        </div>
      </div>
    );
  }

  const { user: friend, quests, missions, rewards, stats } = profile;
  const character = friend.character;
  const xpProgress = (character.xp / character.xpToNextLevel) * 100;
  const hpProgress = (character.hp / character.maxHp) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-dark-card to-bg-dark">
      {/* Header */}
      <header className="border-b border-white/10 bg-bg-dark-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/friends')}
            className="text-text-dark-secondary hover:text-text-dark-primary"
          >
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-xl font-bold text-text-dark-primary">Профіль {character.name}</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Character Info */}
          <div className="space-y-6">
            {/* Character Card */}
            <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10 overflow-hidden">
              <div className="bg-gradient-to-br from-primary-main/30 to-primary-dark/30 p-6">
                <div className="flex items-center gap-4">
                  {character.avatar ? (
                    <img 
                      src={character.avatar} 
                      alt={character.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-primary-main"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center text-white font-bold text-3xl border-4 border-white/20">
                      {character.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-white">{character.name}</h2>
                    <p className="text-primary-main">{character.title || 'Новачок'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star size={16} className="text-accent-gold" />
                      <span className="text-white font-medium">Рівень {character.level}</span>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                {/* XP Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-dark-secondary flex items-center gap-1">
                      <Zap size={14} className="text-primary-main" /> Досвід
                    </span>
                    <span className="text-text-dark-primary">{character.xp} / {character.xpToNextLevel} XP</span>
                  </div>
                  <Progress value={xpProgress} className="h-2" />
                </div>

                {/* HP Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-dark-secondary flex items-center gap-1">
                      <Heart size={14} className="text-red-400" /> Здоров'я
                    </span>
                    <span className="text-text-dark-primary">{character.hp} / {character.maxHp} HP</span>
                  </div>
                  <Progress value={hpProgress} className="h-2 [&>div]:bg-red-500" />
                </div>

                {/* Coins */}
                <div className="flex items-center justify-between bg-bg-dark rounded-lg p-3">
                  <span className="text-text-dark-secondary flex items-center gap-2">
                    <Coins size={18} className="text-accent-gold" /> Монети
                  </span>
                  <span className="text-accent-gold font-bold text-lg">{character.coins}</span>
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
                  <Trophy size={20} className="text-accent-gold" />
                  Статистика
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-bg-dark rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-text-dark-secondary text-sm">Завдання</span>
                    <span className="text-text-dark-primary text-sm">{stats.completedTasks} / {stats.totalTasks}</span>
                  </div>
                  <Progress value={stats.taskCompletionRate} className="h-2" />
                  <p className="text-xs text-text-dark-secondary mt-1">{stats.taskCompletionRate}% виконано</p>
                </div>
                <div className="bg-bg-dark rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-text-dark-secondary text-sm">Квести</span>
                    <span className="text-text-dark-primary text-sm">{stats.completedQuests} / {stats.totalQuests}</span>
                  </div>
                  <Progress value={stats.questCompletionRate} className="h-2 [&>div]:bg-emerald-500" />
                  <p className="text-xs text-text-dark-secondary mt-1">{stats.questCompletionRate}% виконано</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle & Right Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Quests */}
            <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
                  <Target size={20} className="text-primary-main" />
                  Активні квести ({quests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quests.length === 0 ? (
                  <p className="text-text-dark-secondary text-center py-4">Немає активних квестів</p>
                ) : (
                  <div className="space-y-3">
                    {quests.map((quest, idx) => {
                      const progress = quest.steps.length > 0 
                        ? (quest.currentStep / quest.steps.length) * 100 
                        : 0;
                      
                      return (
                        <motion.div
                          key={quest.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-bg-dark rounded-lg p-4 border border-white/10"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-text-dark-primary font-medium">{quest.title}</h4>
                            <span className="text-xs text-primary-main bg-primary-main/20 px-2 py-1 rounded">
                              {quest.currentStep}/{quest.steps.length} кроків
                            </span>
                          </div>
                          {quest.description && (
                            <p className="text-sm text-text-dark-secondary mb-2">{quest.description}</p>
                          )}
                          <Progress value={progress} className="h-2 mb-2" />
                          <div className="flex items-center gap-4 text-xs text-text-dark-secondary">
                            <span className="flex items-center gap-1">
                              <Zap size={12} className="text-primary-main" /> {quest.xpReward} XP
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins size={12} className="text-accent-gold" /> {quest.coinReward}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Missions */}
            <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
                  <Compass size={20} className="text-emerald-400" />
                  Місії ({missions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {missions.length === 0 ? (
                  <p className="text-text-dark-secondary text-center py-4">Немає місій</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {missions.map((mission, idx) => {
                      const validImages = (mission.images || []).filter(img => img);
                      
                      return (
                        <motion.div
                          key={mission.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className={`bg-gradient-to-br ${getColorBg(mission.color)} border-2 ${getColorClass(mission.color)} overflow-hidden h-full`}>
                            {validImages.length > 0 && (
                              <div className={`grid ${validImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1 p-2 bg-black/20`}>
                                {validImages.slice(0, 4).map((img, imgIdx) => (
                                  <div key={imgIdx} className="aspect-square rounded-lg overflow-hidden bg-black/30">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                            <CardContent className="p-4">
                              <h4 className="text-white font-bold text-lg mb-1">{mission.title}</h4>
                              {mission.description && (
                                <p className="text-white/70 text-sm mb-2">{mission.description}</p>
                              )}
                              {mission.slogan && (
                                <p className="text-white/90 italic text-sm border-t border-white/10 pt-2">
                                  &ldquo;{mission.slogan}&rdquo;
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rewards */}
            <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
                  <Gift size={20} className="text-accent-gold" />
                  Придбані винагороди ({rewards.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rewards.length === 0 ? (
                  <p className="text-text-dark-secondary text-center py-4">Немає придбаних винагород</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {rewards.map((reward, idx) => (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-bg-dark rounded-lg border border-white/10 overflow-hidden"
                      >
                        {reward.image && (
                          <div className="aspect-video w-full overflow-hidden">
                            <img src={reward.image} alt={reward.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-3">
                          <h5 className="text-text-dark-primary font-medium text-sm mb-1">{reward.name}</h5>
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle size={12} />
                            <span>Придбано</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendProfilePage;

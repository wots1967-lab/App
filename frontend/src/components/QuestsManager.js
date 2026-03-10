import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Target, Plus, Trash2, CheckCircle2, HelpCircle, X, Users, UserPlus, Check, XCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QAModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-bg-dark-card border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-text-dark-primary flex items-center gap-2">
              <HelpCircle size={24} className="text-primary-main" />
              Як користуватися квестами?
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-text-dark-secondary">
              <X size={20} />
            </Button>
          </div>
          
          <div className="space-y-4 text-text-dark-secondary">
            <div className="bg-bg-dark rounded-lg p-4 border border-primary-main/20">
              <div className="flex items-center gap-2 text-primary-main font-medium mb-2">
                <Target size={18} />
                Створення квесту
              </div>
              <ul className="space-y-2 text-sm">
                <li>1. Натисніть кнопку "+" щоб створити новий квест</li>
                <li>2. Введіть назву та винагороду за виконання</li>
                <li>3. Додайте кроки - етапи виконання квесту</li>
                <li>4. Виконуйте кроки по черзі для прогресу</li>
              </ul>
            </div>
            
            <div className="bg-bg-dark rounded-lg p-4 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 font-medium mb-2">
                <Users size={18} />
                Спільні квести
              </div>
              <ul className="space-y-2 text-sm">
                <li>• Запросіть друзів до свого квесту</li>
                <li>• Вони отримають копію квесту після підтвердження</li>
                <li>• Кожен виконує кроки самостійно</li>
                <li>• Слідкуйте за прогресом друзів</li>
              </ul>
            </div>
            
            <div className="bg-bg-dark rounded-lg p-4 border border-accent-gold/20">
              <div className="flex items-center gap-2 text-accent-gold font-medium mb-2">
                <CheckCircle2 size={18} />
                Винагороди
              </div>
              <ul className="space-y-2 text-sm">
                <li>• Легкий: 100 XP, 50 монет</li>
                <li>• Середній: 200 XP, 100 монет</li>
                <li>• Важкий: 500 XP, 250 монет</li>
              </ul>
            </div>
          </div>
          
          <Button onClick={onClose} className="w-full mt-4 bg-gradient-to-r from-primary-main to-primary-dark">
            Зрозуміло!
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const InviteFriendsModal = ({ isOpen, onClose, questId, token }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
    // eslint-disable-next-line
  }, [isOpen]);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (friendId, friendName) => {
    setInviting(friendId);
    try {
      await axios.post(
        `${API}/quests/${questId}/invite`,
        { friendId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Запрошення відправлено ${friendName}!`);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Вже запрошено');
      } else {
        toast.error('Помилка відправки');
      }
    } finally {
      setInviting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-bg-dark-card border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-text-dark-primary flex items-center gap-2">
              <UserPlus size={24} className="text-primary-main" />
              Запросити друзів
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-text-dark-secondary">
              <X size={20} />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-text-dark-secondary">Завантаження...</div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 text-text-dark-secondary">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Немає друзів для запрошення</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between bg-bg-dark p-3 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center text-white font-bold">
                      {friend.friendName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-text-dark-primary">{friend.friendName}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleInvite(friend.friendId, friend.friendName)}
                    disabled={inviting === friend.friendId}
                    className="bg-primary-main hover:bg-primary-dark"
                  >
                    {inviting === friend.friendId ? '...' : 'Запросити'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button onClick={onClose} variant="outline" className="w-full mt-4 border-white/10">
            Закрити
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const QuestsManager = () => {
  const { token } = useAuth();
  const [quests, setQuests] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showQA, setShowQA] = useState(false);
  const [inviteQuestId, setInviteQuestId] = useState(null);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    reward: '',
    steps: [{ title: '' }]
  });

  useEffect(() => {
    if (token) {
      fetchQuests();
      fetchInvitations();
    }
    // eslint-disable-next-line
  }, [token]);

  const fetchQuests = async () => {
    try {
      const response = await axios.get(`${API}/quests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuests(response.data);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await axios.get(`${API}/quests/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvitations(response.data);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  const handleAddQuest = async (e) => {
    e.preventDefault();
    if (!newQuest.title.trim()) return;

    const validSteps = newQuest.steps.filter(s => s.title.trim());
    if (validSteps.length === 0) {
      toast.error('Додайте хоча б один крок');
      return;
    }

    try {
      await axios.post(
        `${API}/quests`,
        { ...newQuest, steps: validSteps },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Квест створено!');
      setNewQuest({ title: '', description: '', difficulty: 'medium', reward: '', steps: [{ title: '' }] });
      setShowAdd(false);
      fetchQuests();
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const handleCompleteStep = async (questId) => {
    try {
      await axios.post(
        `${API}/quests/${questId}/next-step`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Крок виконано!');
      fetchQuests();
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const handleDeleteQuest = async (questId) => {
    try {
      await axios.delete(`${API}/quests/${questId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Квест видалено');
      fetchQuests();
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await axios.post(
        `${API}/quests/invitations/${invitationId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Квест додано!');
      fetchQuests();
      fetchInvitations();
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const handleDeclineInvitation = async (invitationId) => {
    try {
      await axios.post(
        `${API}/quests/invitations/${invitationId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Запрошення відхилено');
      fetchInvitations();
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const activeQuests = quests.filter(q => !q.completed);

  const renderQuestItem = (quest) => {
    const progress = (quest.currentStep / quest.steps.length) * 100;
    
    return (
      <motion.div 
        key={quest.id} 
        className="group" 
        data-testid={`quest-${quest.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-bg-dark border border-white/10 rounded-lg p-4 hover:border-primary-main/50 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-text-dark-primary font-bold">{quest.title}</h3>
                {quest.isShared && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Share2 size={10} /> Спільний
                  </span>
                )}
              </div>
              <p className="text-sm text-text-dark-secondary">Крок {quest.currentStep + 1} / {quest.steps.length}</p>
            </div>
            <div className="flex items-center gap-1">
              {!quest.isShared && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInviteQuestId(quest.id)}
                  className="text-primary-main hover:text-primary-dark"
                  title="Запросити друзів"
                  data-testid={`invite-quest-${quest.id}`}
                >
                  <UserPlus size={16} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteQuest(quest.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400"
                data-testid={`delete-quest-${quest.id}`}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mb-3" />
          {quest.currentStep < quest.steps.length && (
            <div className="bg-bg-dark-card p-3 rounded-lg mb-2">
              <p className="text-text-dark-primary text-sm mb-2">{quest.steps[quest.currentStep].title}</p>
              <Button
                size="sm"
                onClick={() => handleCompleteStep(quest.id)}
                className="bg-gradient-to-r from-secondary-main to-green-600"
                data-testid={`complete-quest-step-${quest.id}`}
              >
                <CheckCircle2 size={16} className="mr-1" />
                Виконати крок
              </Button>
            </div>
          )}
          {quest.reward && (
            <p className="text-xs text-accent-gold mt-2">Винагорода: {quest.reward}</p>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="quests-manager">
        <CardHeader>
          <CardTitle className="text-xl text-text-dark-primary flex items-center justify-between">
            <span>Квести</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQA(true)}
                className="text-primary-main hover:text-primary-dark"
                title="Як користуватися?"
                data-testid="quests-qa-btn"
              >
                <HelpCircle size={20} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(!showAdd)} data-testid="toggle-add-quest">
                <Plus size={20} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invitations */}
          {invitations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-text-dark-secondary font-medium">Запрошення до квестів:</p>
              {invitations.map((inv) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-dark-primary font-medium">{inv.questTitle}</p>
                      <p className="text-xs text-text-dark-secondary">від {inv.fromUserName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvitation(inv.id)}
                        className="bg-emerald-500 hover:bg-emerald-600"
                        data-testid={`accept-invitation-${inv.id}`}
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineInvitation(inv.id)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        data-testid={`decline-invitation-${inv.id}`}
                      >
                        <XCircle size={14} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Motivational message */}
          <div className="bg-primary-main/10 border border-primary-main/30 rounded-lg p-4">
            <p className="text-base text-text-dark-primary mb-1 font-medium">
              Створюй свої квести, виставляй унікальні винагороди, запрошуй друзів.
            </p>
            <p className="text-sm text-text-dark-secondary">
              Зроби з великих цілей справжні пригоди.
            </p>
          </div>

          {showAdd && (
            <form onSubmit={handleAddQuest} className="space-y-3 p-4 bg-bg-dark rounded-lg border border-white/10">
              <Input
                placeholder="Назва квесту..."
                value={newQuest.title}
                onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                className="bg-bg-dark-card border-white/10 text-white"
                data-testid="quest-title-input"
              />
              <Input
                placeholder="Винагорода за квест..."
                value={newQuest.reward}
                onChange={(e) => setNewQuest({ ...newQuest, reward: e.target.value })}
                className="bg-bg-dark-card border-white/10 text-white"
              />
              {newQuest.steps.map((step, idx) => (
                <Input
                  key={idx}
                  placeholder={`Крок ${idx + 1}...`}
                  value={step.title}
                  onChange={(e) => {
                    const steps = [...newQuest.steps];
                    steps[idx].title = e.target.value;
                    setNewQuest({ ...newQuest, steps });
                  }}
                  className="bg-bg-dark-card border-white/10 text-white"
                />
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewQuest({ ...newQuest, steps: [...newQuest.steps, { title: '' }] })}
                className="w-full"
              >
                + Додати крок
              </Button>
              <Button type="submit" className="w-full bg-gradient-to-r from-primary-main to-primary-dark" data-testid="create-quest-button">
                Створити квест
              </Button>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8 text-text-dark-secondary">Завантаження...</div>
          ) : activeQuests.length === 0 ? (
            <div className="text-center py-8 px-6">
              <Target size={48} className="mx-auto mb-4 text-text-dark-secondary opacity-50" />
              <p className="text-text-dark-secondary">
                Немає активних квестів. Створіть перший!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeQuests.map(renderQuestItem)}
            </div>
          )}
        </CardContent>
      </Card>

      <QAModal isOpen={showQA} onClose={() => setShowQA(false)} />
      <InviteFriendsModal 
        isOpen={inviteQuestId !== null} 
        onClose={() => setInviteQuestId(null)} 
        questId={inviteQuestId}
        token={token}
      />
    </>
  );
};

export default QuestsManager;

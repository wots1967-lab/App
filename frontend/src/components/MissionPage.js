import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plus, Trash2, Edit2, Save, X, Target, Compass, Sparkles, Image } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CARD_COLORS = [
  { id: 'purple', name: 'Фіолетовий', class: 'border-purple-500', bg: 'from-purple-500/20 to-purple-900/30' },
  { id: 'blue', name: 'Синій', class: 'border-blue-500', bg: 'from-blue-500/20 to-blue-900/30' },
  { id: 'emerald', name: 'Смарагдовий', class: 'border-emerald-500', bg: 'from-emerald-500/20 to-emerald-900/30' },
  { id: 'amber', name: 'Бурштиновий', class: 'border-amber-500', bg: 'from-amber-500/20 to-amber-900/30' },
  { id: 'rose', name: 'Рожевий', class: 'border-rose-500', bg: 'from-rose-500/20 to-rose-900/30' },
  { id: 'slate', name: 'Класичний', class: 'border-slate-400', bg: 'from-slate-500/20 to-slate-900/30' },
  { id: 'cyan', name: 'Бірюзовий', class: 'border-cyan-500', bg: 'from-cyan-500/20 to-cyan-900/30' },
  { id: 'orange', name: 'Помаранчевий', class: 'border-orange-500', bg: 'from-orange-500/20 to-orange-900/30' },
];

const MissionPage = () => {
  const { token } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newMission, setNewMission] = useState({
    title: '',
    description: '',
    slogan: '',
    images: ['', '', '', ''],
    color: 'purple'
  });

  useEffect(() => {
    if (token) {
      fetchMissions();
    }
    // eslint-disable-next-line
  }, [token]);

  const fetchMissions = async () => {
    try {
      const response = await axios.get(`${API}/missions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMissions(response.data);
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMission = async (e) => {
    e.preventDefault();
    if (!newMission.title.trim()) return;

    try {
      await axios.post(
        `${API}/missions`,
        {
          ...newMission,
          images: newMission.images.filter(img => img.trim())
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Картку місії створено!');
      setNewMission({ title: '', description: '', slogan: '', images: ['', '', '', ''], color: 'purple' });
      setShowAdd(false);
      fetchMissions();
    } catch (error) {
      toast.error('Помилка при створенні картки');
      console.error('Failed to add mission:', error);
    }
  };

  const handleUpdateMission = async (id) => {
    const mission = missions.find(m => m.id === id);
    if (!mission) return;

    try {
      await axios.put(
        `${API}/missions/${id}`,
        mission,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Картку оновлено!');
      setEditingId(null);
      fetchMissions();
    } catch (error) {
      toast.error('Помилка при оновленні');
      console.error('Failed to update mission:', error);
    }
  };

  const handleDeleteMission = async (id) => {
    try {
      await axios.delete(`${API}/missions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Картку видалено');
      fetchMissions();
    } catch (error) {
      toast.error('Помилка при видаленні');
      console.error('Failed to delete mission:', error);
    }
  };

  const updateMissionField = (id, field, value) => {
    setMissions(missions.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const updateMissionImage = (id, index, value) => {
    setMissions(missions.map(m => {
      if (m.id === id) {
        const newImages = [...(m.images || ['', '', '', ''])];
        newImages[index] = value;
        return { ...m, images: newImages };
      }
      return m;
    }));
  };

  const getColorClass = (colorId) => {
    const color = CARD_COLORS.find(c => c.id === colorId);
    return color ? color.class : 'border-purple-500';
  };

  const getColorBg = (colorId) => {
    const color = CARD_COLORS.find(c => c.id === colorId);
    return color ? color.bg : 'from-purple-500/20 to-purple-900/30';
  };

  if (loading) {
    return (
      <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
        <CardContent className="py-12 text-center text-text-dark-secondary">
          Завантаження...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="mission-page">
      {/* Header */}
      <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center">
                <Compass size={24} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-text-dark-primary">Моя Місія</CardTitle>
                <p className="text-sm text-text-dark-secondary">Визнач хто ти, для чого і куди рухаєшся</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAdd(!showAdd)}
              className="bg-gradient-to-r from-primary-main to-primary-dark"
              data-testid="add-mission-btn"
            >
              <Plus size={18} className="mr-2" />
              Нова картка
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add New Mission Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-bg-dark-card/80 backdrop-blur-md border-primary-main/50">
              <CardHeader>
                <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
                  <Sparkles size={20} className="text-primary-main" />
                  Створити нову картку-нагадування
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMission} className="space-y-4">
                  <div>
                    <label className="text-sm text-text-dark-secondary mb-2 block">Назва</label>
                    <Input
                      type="text"
                      placeholder="Хто я? Наприклад: Творець, Воїн, Лідер..."
                      value={newMission.title}
                      onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                      className="bg-bg-dark border-white/10 text-white"
                      data-testid="mission-title-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-text-dark-secondary mb-2 block">Опис</label>
                    <Textarea
                      placeholder="Опиши свою місію детальніше. Для чого ти тут? Що хочеш створити?"
                      value={newMission.description}
                      onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                      className="bg-bg-dark border-white/10 text-white min-h-[100px]"
                      data-testid="mission-description-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-text-dark-secondary mb-2 block">Коротке гасло</label>
                    <Input
                      type="text"
                      placeholder="Твоя мантра або девіз"
                      value={newMission.slogan}
                      onChange={(e) => setNewMission({ ...newMission, slogan: e.target.value })}
                      className="bg-bg-dark border-white/10 text-white"
                      data-testid="mission-slogan-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-text-dark-secondary mb-2 block flex items-center gap-2">
                      <Image size={16} />
                      Мудборд (до 4 зображень)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {newMission.images.map((img, idx) => (
                        <Input
                          key={idx}
                          type="text"
                          placeholder={`URL зображення ${idx + 1}`}
                          value={img}
                          onChange={(e) => {
                            const newImages = [...newMission.images];
                            newImages[idx] = e.target.value;
                            setNewMission({ ...newMission, images: newImages });
                          }}
                          className="bg-bg-dark border-white/10 text-white text-sm"
                          data-testid={`mission-image-input-${idx}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-text-dark-secondary mb-2 block">Колір рамки</label>
                    <div className="flex flex-wrap gap-2">
                      {CARD_COLORS.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setNewMission({ ...newMission, color: color.id })}
                          className={`w-8 h-8 rounded-lg border-2 transition-transform ${color.class} ${
                            newMission.color === color.id ? 'scale-110 ring-2 ring-white/50' : 'opacity-60 hover:opacity-100'
                          }`}
                          title={color.name}
                          data-testid={`color-${color.id}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-primary-main to-primary-dark"
                      disabled={!newMission.title.trim()}
                      data-testid="create-mission-btn"
                    >
                      Створити картку
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAdd(false)}
                      className="border-white/10"
                    >
                      Скасувати
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission Cards Grid */}
      {missions.length === 0 ? (
        <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
          <CardContent className="py-12 text-center">
            <Target size={48} className="mx-auto mb-4 text-text-dark-secondary opacity-50" />
            <p className="text-text-dark-secondary mb-2">Немає карток місії</p>
            <p className="text-sm text-text-dark-secondary">Створіть першу картку, щоб завжди пам'ятати хто ви і куди рухаєтесь!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {missions.map((mission, index) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                data-testid={`mission-card-${mission.id}`}
              >
                <Card className={`bg-gradient-to-br ${getColorBg(mission.color)} backdrop-blur-md border-2 ${getColorClass(mission.color)} overflow-hidden`}>
                  {/* Moodboard Images */}
                  {mission.images && mission.images.filter(img => img).length > 0 && (
                    <div className="grid grid-cols-2 gap-1 p-2 bg-black/20">
                      {mission.images.filter(img => img).map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-black/30">
                          <img 
                            src={img} 
                            alt={`Moodboard ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <CardContent className="p-5">
                    {editingId === mission.id ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <Input
                          value={mission.title}
                          onChange={(e) => updateMissionField(mission.id, 'title', e.target.value)}
                          className="bg-bg-dark/50 border-white/20 text-white font-bold"
                        />
                        <Textarea
                          value={mission.description}
                          onChange={(e) => updateMissionField(mission.id, 'description', e.target.value)}
                          className="bg-bg-dark/50 border-white/20 text-white min-h-[80px]"
                        />
                        <Input
                          value={mission.slogan}
                          onChange={(e) => updateMissionField(mission.id, 'slogan', e.target.value)}
                          placeholder="Гасло"
                          className="bg-bg-dark/50 border-white/20 text-white italic"
                        />
                        <div className="grid grid-cols-2 gap-1">
                          {[0, 1, 2, 3].map((idx) => (
                            <Input
                              key={idx}
                              value={mission.images?.[idx] || ''}
                              onChange={(e) => updateMissionImage(mission.id, idx, e.target.value)}
                              placeholder={`URL ${idx + 1}`}
                              className="bg-bg-dark/50 border-white/20 text-white text-xs"
                            />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {CARD_COLORS.map((color) => (
                            <button
                              key={color.id}
                              type="button"
                              onClick={() => updateMissionField(mission.id, 'color', color.id)}
                              className={`w-6 h-6 rounded border ${color.class} ${
                                mission.color === color.id ? 'ring-2 ring-white/50' : 'opacity-50'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateMission(mission.id)}
                            className="flex-1 bg-green-500 hover:bg-green-600"
                          >
                            <Save size={14} className="mr-1" /> Зберегти
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="border-white/20"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="text-2xl font-bold text-white">{mission.title}</h3>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingId(mission.id)}
                              className="h-8 w-8 text-white/70 hover:text-white"
                              data-testid={`edit-mission-${mission.id}`}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMission(mission.id)}
                              className="h-8 w-8 text-red-400 hover:text-red-300"
                              data-testid={`delete-mission-${mission.id}`}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        
                        {mission.description && (
                          <p className="text-white/80 text-sm leading-relaxed">
                            {mission.description}
                          </p>
                        )}
                        
                        {mission.slogan && (
                          <div className="pt-2 border-t border-white/10">
                            <p className="text-lg italic text-white/90 font-medium">
                              "{mission.slogan}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MissionPage;

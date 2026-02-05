import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plus, Trash2, Edit2, Save, X, Target, Compass, Sparkles, Upload, ImageIcon } from 'lucide-react';
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

const ImageUploader = ({ images, onImagesChange, maxImages = 4 }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    const currentImageCount = images.filter(img => img).length;
    const availableSlots = maxImages - currentImageCount;
    
    if (files.length > availableSlots) {
      toast.warning(`Можна додати ще ${availableSlots} зображень`);
    }

    const filesToProcess = files.slice(0, availableSlots);
    
    for (const file of filesToProcess) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Зображення має бути менше 5MB');
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        const newImages = [...images];
        const emptyIndex = newImages.findIndex(img => !img);
        if (emptyIndex !== -1) {
          newImages[emptyIndex] = base64;
        } else {
          newImages.push(base64);
        }
        onImagesChange(newImages.slice(0, maxImages));
      };
      reader.readAsDataURL(file);
    }
    
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages[index] = '';
    onImagesChange(newImages);
  };

  const validImages = images.filter(img => img);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-text-dark-secondary flex items-center gap-2">
          <ImageIcon size={16} />
          Мудборд ({validImages.length}/{maxImages})
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={validImages.length >= maxImages}
          className="border-white/20 text-text-dark-secondary hover:text-white"
        >
          <Upload size={14} className="mr-2" />
          Завантажити
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      
      {validImages.length > 0 && (
        <div className={`grid gap-2 ${validImages.length === 1 ? 'grid-cols-1' : validImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {images.map((img, idx) => img && (
            <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden bg-black/30">
              <img 
                src={img} 
                alt={`Moodboard ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {validImages.length === 0 && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-primary-main/50 transition-colors"
        >
          <ImageIcon size={32} className="mx-auto mb-2 text-text-dark-secondary opacity-50" />
          <p className="text-sm text-text-dark-secondary">Натисніть або перетягніть зображення</p>
        </div>
      )}
    </div>
  );
};

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

  const getColorClass = (colorId) => {
    const color = CARD_COLORS.find(c => c.id === colorId);
    return color ? color.class : 'border-purple-500';
  };

  const getColorBg = (colorId) => {
    const color = CARD_COLORS.find(c => c.id === colorId);
    return color ? color.bg : 'from-purple-500/20 to-purple-900/30';
  };

  const getImageGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-2';
    return 'grid-cols-2';
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
                <p className="text-sm text-text-dark-secondary">Опиши свою місію. Чого ти прагнеш або куди прямуєш.</p>
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

                  <ImageUploader
                    images={newMission.images}
                    onImagesChange={(images) => setNewMission({ ...newMission, images })}
                    maxImages={4}
                  />

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
            <p className="text-sm text-text-dark-secondary">Створіть першу картку, щоб завжди памʼятати хто ви і куди рухаєтесь!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {missions.map((mission, index) => {
              const validImages = (mission.images || []).filter(img => img);
              
              return (
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
                    {validImages.length > 0 && (
                      <div className={`grid ${getImageGridClass(validImages.length)} gap-1 p-2 bg-black/20`}>
                        {validImages.map((img, idx) => (
                          <div 
                            key={idx} 
                            className={`${validImages.length === 1 ? 'aspect-video' : validImages.length === 3 && idx === 0 ? 'col-span-2 aspect-video' : 'aspect-square'} rounded-lg overflow-hidden bg-black/30`}
                          >
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
                          <ImageUploader
                            images={mission.images || ['', '', '', '']}
                            onImagesChange={(images) => updateMissionField(mission.id, 'images', images)}
                            maxImages={4}
                          />
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
                                &ldquo;{mission.slogan}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MissionPage;

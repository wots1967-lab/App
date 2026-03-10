import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Bell, Check, Target, Trophy, Gift, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NotificationsDropdown = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchNotifications();
      fetchInvitations();
      fetchUnreadCount();
      
      const interval = setInterval(() => {
        fetchUnreadCount();
        if (isOpen) {
          fetchNotifications();
          fetchInvitations();
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line
  }, [token, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
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

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API}/notifications/unread/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.post(`${API}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await axios.post(`${API}/quests/invitations/${invitationId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInvitations();
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    }
  };

  const handleDeclineInvitation = async (invitationId) => {
    try {
      await axios.post(`${API}/quests/invitations/${invitationId}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInvitations();
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'quest_invite_accepted':
        return <Target size={16} className="text-primary-main" />;
      case 'quest_complete':
        return <Trophy size={16} className="text-accent-gold" />;
      case 'achievement':
        return <Trophy size={16} className="text-emerald-400" />;
      case 'reward_received':
        return <Gift size={16} className="text-pink-400" />;
      case 'friend_achievement':
        return <Users size={16} className="text-blue-400" />;
      default:
        return <Bell size={16} className="text-text-dark-secondary" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'щойно';
    if (diffMins < 60) return `${diffMins} хв`;
    if (diffHours < 24) return `${diffHours} год`;
    return `${diffDays} дн`;
  };

  const allItems = [
    ...invitations.map(inv => ({ ...inv, itemType: 'invitation' })),
    ...notifications.map(n => ({ ...n, itemType: 'notification' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-text-dark-secondary hover:text-text-dark-primary"
        data-testid="notifications-button"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-main rounded-full text-xs flex items-center justify-center text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-bg-dark-card border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-text-dark-primary font-bold">Сповіщення</h3>
              {notifications.some(n => !n.read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-primary-main text-xs"
                >
                  Прочитати всі
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
              {allItems.length === 0 ? (
                <div className="p-8 text-center text-text-dark-secondary">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Немає нових сповіщень</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {allItems.map((item) => (
                    item.itemType === 'invitation' ? (
                      /* Quest Invitation */
                      <div key={`inv-${item.id}`} className="p-4 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Target size={16} className="text-emerald-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-text-dark-primary text-sm font-medium">
                              Запрошення в квест
                            </p>
                            <p className="text-text-dark-secondary text-xs mb-2">
                              {item.fromUserName} запрошує вас до квесту &quot;{item.questTitle}&quot;
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptInvitation(item.id)}
                                className="h-7 bg-emerald-500 hover:bg-emerald-600 text-xs"
                              >
                                <Check size={12} className="mr-1" /> Прийняти
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeclineInvitation(item.id)}
                                className="h-7 border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs"
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Regular Notification */
                      <div
                        key={`notif-${item.id}`}
                        className={`p-4 hover:bg-white/5 transition-colors ${!item.read ? 'bg-primary-main/5' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-bg-dark flex items-center justify-center">
                            {getNotificationIcon(item.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-text-dark-primary text-sm font-medium">
                              {item.title}
                            </p>
                            <p className="text-text-dark-secondary text-xs">
                              {item.message}
                            </p>
                            <p className="text-text-dark-secondary text-xs mt-1 opacity-60">
                              {formatTime(item.createdAt)}
                            </p>
                          </div>
                          {!item.read && (
                            <div className="w-2 h-2 rounded-full bg-primary-main" />
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => { navigate('/quests'); setIsOpen(false); }}
                className="w-full text-text-dark-secondary text-sm hover:text-primary-main"
              >
                Перейти до квестів
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsDropdown;

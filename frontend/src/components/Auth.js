import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Успішний вхід!');
      } else {
        if (!characterName.trim()) {
          toast.error('Введіть ім\'я персонажа');
          setLoading(false);
          return;
        }
        await register(email, password, characterName);
        toast.success('Вітаємо у Братстві!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Помилка. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-dark via-bg-dark-card to-bg-dark p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="auth-card">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center">
                <Shield size={32} className="text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
              Братство
            </CardTitle>
            <CardDescription className="text-center text-text-dark-secondary">
              {isLogin ? 'Вітаємо назад, герою!' : 'Приєднуйся до Братства'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="characterName" className="text-text-dark-primary">
                    Ім'я персонажа
                  </Label>
                  <Input
                    id="characterName"
                    type="text"
                    placeholder="Герой"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    className="bg-bg-dark border-white/10 text-white focus:border-primary-main"
                    required={!isLogin}
                    data-testid="character-name-input"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-dark-primary">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hero@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-bg-dark border-white/10 text-white focus:border-primary-main"
                  required
                  data-testid="email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-text-dark-primary">
                  Пароль
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-bg-dark border-white/10 text-white focus:border-primary-main"
                  required
                  data-testid="password-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-main to-primary-dark hover:shadow-primary-glow transition-all duration-300"
                disabled={loading}
                data-testid="submit-button"
              >
                {loading ? 'Завантаження...' : (isLogin ? 'Увійти' : 'Приєднатися до Братства')}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-main hover:text-primary-dark transition-colors"
                data-testid="toggle-auth-mode"
              >
                {isLogin ? 'Немає акаунту? Зареєструйтесь' : 'Вже є акаунт? Увійдіть'}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
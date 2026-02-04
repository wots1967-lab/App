import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';

const SkillsOverview = () => {
  const { user } = useAuth();
  const skills = user?.character?.skills;

  if (!skills) return null;

  const skillsData = [
    { key: 'fitness', label: 'Фітнес', icon: '🏋️', color: 'text-red-400' },
    { key: 'learning', label: 'Навчання', icon: '📚', color: 'text-blue-400' },
    { key: 'work', label: 'Робота', icon: '💼', color: 'text-yellow-400' },
    { key: 'household', label: 'Побут', icon: '🏠', color: 'text-green-400' },
    { key: 'creativity', label: 'Творчість', icon: '🎨', color: 'text-purple-400' },
    { key: 'health', label: 'Здоров\'я', icon: '❤️', color: 'text-pink-400' },
    { key: 'finance', label: 'Фінанси', icon: '💰', color: 'text-orange-400' },
    { key: 'social', label: 'Соціальне', icon: '👥', color: 'text-cyan-400' }
  ];

  return (
    <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="skills-overview">
      <CardHeader>
        <CardTitle className="text-lg text-text-dark-primary">Навички</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {skillsData.map((skill) => {
          const skillData = skills[skill.key];
          const level = skillData?.level || 1;
          const xp = skillData?.xp || 0;
          const xpNeeded = level * 100;
          const progress = (xp / xpNeeded) * 100;

          return (
            <div key={skill.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{skill.icon}</span>
                  <span className="text-sm text-text-dark-primary">{skill.label}</span>
                </div>
                <span className={`text-sm font-bold ${skill.color}`} data-testid={`skill-level-${skill.key}`}>
                  Рівень {level}
                </span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          );
        })}</CardContent>
    </Card>
  );
};

export default SkillsOverview;
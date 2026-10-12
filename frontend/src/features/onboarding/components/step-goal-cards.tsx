import React from 'react';
import { Trophy, Compass, Star, Sparkles, Check } from 'lucide-react';

export type UserGoal = 'WIN' | 'LEARN' | 'PORTFOLIO' | 'ALL';

const GOALS = [
  {
    id: 'WIN' as UserGoal,
    label: 'Win it',
    desc: "Eyes on the podium, top track, and judges' praise.",
    icon: Trophy,
  },
  {
    id: 'LEARN' as UserGoal,
    label: 'Learn a lot',
    desc: 'Explore new frameworks, test emerging models, expand horizons.',
    icon: Compass,
  },
  {
    id: 'PORTFOLIO' as UserGoal,
    label: 'Build my portfolio',
    desc: 'Ship clean code that looks killer on GitHub and resume.',
    icon: Star,
  },
  {
    id: 'ALL' as UserGoal,
    label: 'All three',
    desc: "Why compromise? We're taking the trophies, skills, and code.",
    icon: Sparkles,
  },
];

export interface StepGoalCardsProps {
  value?: UserGoal;
  onChange: (goal: UserGoal) => void;
}

export function StepGoalCards({ value, onChange }: StepGoalCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {GOALS.map((goal) => {
        const isSelected = value === goal.id;
        const Icon = goal.icon;

        return (
          <button
            key={goal.id}
            type="button"
            onClick={() => onChange(goal.id)}
            className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm ring-2 ring-neutral-900/10'
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60 text-neutral-900'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                isSelected ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-800'
              }`}
            >
              <Icon className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold truncate">{goal.label}</span>
                {isSelected && <Check className="size-4 shrink-0 stroke-[2.5]" />}
              </div>
              <p
                className={`text-xs mt-1 leading-snug line-clamp-2 ${
                  isSelected ? 'text-neutral-300' : 'text-neutral-500'
                }`}
              >
                {goal.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

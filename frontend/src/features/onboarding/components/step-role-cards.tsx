import React, { useState } from 'react';
import {
  Code,
  Server,
  Sparkles,
  Palette,
  Mic,
  Compass,
  CheckCircle2,
  Check,
} from 'lucide-react';

const ROLES = [
  { id: 'Frontend', label: 'Frontend', desc: 'UI, components & design systems', icon: Code },
  { id: 'Backend', label: 'Backend', desc: 'APIs, auth & database logic', icon: Server },
  { id: 'ML / AI', label: 'ML / AI', desc: 'Models, prompts & pipelines', icon: Sparkles },
  { id: 'Design', label: 'Design', desc: 'Figma, user flows & polish', icon: Palette },
  { id: 'Presenter', label: 'Presenter', desc: 'Pitch narrative, demo & Q&A', icon: Mic },
  { id: 'Domain expert', label: 'Domain expert', desc: 'Problem context & user needs', icon: Compass },
  { id: 'QA / Demo operator', label: 'QA / Demo', desc: 'Edge cases & insurance backups', icon: CheckCircle2 },
];

export interface StepRoleCardsProps {
  selected: string[];
  onChange: (roles: string[]) => void;
}

export function StepRoleCards({ selected, onChange }: StepRoleCardsProps) {
  const [shaking, setShaking] = useState(false);

  const toggleRole = (roleId: string) => {
    if (selected.includes(roleId)) {
      onChange(selected.filter((r) => r !== roleId));
    } else {
      if (selected.length >= 3) {
        setShaking(true);
        setTimeout(() => setShaking(false), 450);
        return;
      }
      onChange([...selected, roleId]);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Role Cards Grid */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 transition-transform ${
          shaking ? 'animate-[wiggle_0.45s_ease-in-out]' : ''
        }`}
      >
        {ROLES.map((role) => {
          const isSelected = selected.includes(role.id);
          const Icon = role.icon;

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => toggleRole(role.id)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm ring-2 ring-neutral-900/10'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60 text-neutral-900'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isSelected ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold truncate">{role.label}</span>
                  {isSelected && <Check className="size-4 shrink-0 stroke-[2.5]" />}
                </div>
                <p
                  className={`text-xs mt-0.5 leading-snug line-clamp-1 ${
                    isSelected ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {role.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
        <span>Selected: {selected.length} of 3</span>
        {selected.length === 3 && (
          <span className="text-amber-600 font-medium">Max 3 roles reached</span>
        )}
      </div>
    </div>
  );
}

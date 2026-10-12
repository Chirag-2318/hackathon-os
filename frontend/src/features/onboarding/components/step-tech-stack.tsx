import React, { useState, useMemo } from 'react';
import { Search, Plus, Check, X } from 'lucide-react';

const TECH_CATALOG: { category: string; items: string[] }[] = [
  {
    category: 'Frontend',
    items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vue', 'Svelte', 'Vite'],
  },
  {
    category: 'Backend',
    items: ['Node.js', 'Python', 'FastAPI', 'Java / Spring', 'Go', 'Rust', 'PostgreSQL', 'Redis'],
  },
  {
    category: 'Data & AI',
    items: ['OpenAI / LLMs', 'PyTorch', 'LangChain', 'Vector DB', 'Supabase', 'Hugging Face'],
  },
  {
    category: 'Mobile',
    items: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
  },
  {
    category: 'DevOps & Cloud',
    items: ['Docker', 'AWS', 'Vercel', 'GitHub Actions', 'Linux', 'Kubernetes'],
  },
  {
    category: 'Design & Product',
    items: ['Figma', 'Canva', 'Blender', 'Spline', 'UI/UX'],
  },
];

export interface StepTechStackProps {
  selected: string[];
  onChange: (items: string[]) => void;
}

export function StepTechStack({ selected, onChange }: StepTechStackProps) {
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState('');

  const toggleItem = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((i) => i !== item));
    } else {
      if (selected.length >= 8) return;
      onChange([...selected, item]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    if (selected.length >= 8) return;
    onChange([...selected, trimmed]);
    setCustomInput('');
  };

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return TECH_CATALOG;
    const q = search.trim().toLowerCase();
    return TECH_CATALOG.map((group) => ({
      category: group.category,
      items: group.items.filter((item) => item.toLowerCase().includes(q)),
    })).filter((group) => group.items.length > 0);
  }, [search]);

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* ── Search & Custom Add Bar ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technologies..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-neutral-900"
          />
        </div>

        {/* Custom Input */}
        <form onSubmit={handleAddCustom} className="flex gap-1.5 shrink-0">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add custom..."
            maxLength={24}
            className="w-32 h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-neutral-900"
          />
          <button
            type="submit"
            disabled={!customInput.trim() || selected.length >= 8}
            className="h-9 px-3 rounded-xl bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="size-3.5" /> Add
          </button>
        </form>
      </div>

      {/* ── Counter ── */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>Selected: {selected.length} of 8</span>
        {selected.length >= 8 && (
          <span className="text-amber-600 font-medium">Maximum 8 technologies selected</span>
        )}
      </div>

      {/* ── Selected Chips Bar (if any) ── */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 text-white text-xs font-medium shadow-xs"
            >
              <Check className="size-3 stroke-[2.5]" />
              {item}
              <button
                type="button"
                onClick={() => toggleItem(item)}
                className="hover:text-red-300 transition-colors cursor-pointer"
                aria-label={`Remove ${item}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Grouped Categories Cloud ── */}
      <div className="flex flex-col gap-3.5 max-h-[220px] overflow-y-auto pr-1">
        {filteredCatalog.map((group) => (
          <div key={group.category} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              {group.category}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => {
                const isSelected = selected.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleItem(item)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white ring-1 ring-neutral-900 shadow-xs'
                        : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

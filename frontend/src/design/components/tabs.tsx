import React from 'react';
import {
  Tabs as RadixTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface SimpleTabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
  className?: string;
}

/**
 * Tabs component offering both convenient declarative items syntax
 * and primitive subcomponents.
 */
export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
  className,
}: SimpleTabsProps) {
  const initialValue = defaultValue || items[0]?.id;

  return (
    <RadixTabs
      defaultValue={initialValue}
      value={value}
      onValueChange={onValueChange}
      className={cn('w-full', className)}
    >
      <TabsList className="bg-transparent border-b border-zinc-200 dark:border-zinc-800 rounded-none p-0 h-auto gap-4 justify-start">
        {items.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className="pb-2.5 pt-1 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 data-[state=active]:font-medium text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 shadow-none transition-colors"
          >
            {tab.icon && <span className="mr-1.5 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="pt-4 outline-none">
          {tab.content}
        </TabsContent>
      ))}
    </RadixTabs>
  );
}

export { RadixTabs, TabsList, TabsTrigger, TabsContent };

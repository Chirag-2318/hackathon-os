import { type DiagramTemplate } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LayoutTemplate, Server, Users, GitCommit, Database, Map as MapIcon } from 'lucide-react';

interface TemplateGalleryProps {
  templates: DiagramTemplate[];
  onSelect: (code: string) => void;
}

export function TemplateGallery({ templates, onSelect }: TemplateGalleryProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'server': return <Server className="h-5 w-5 mb-2 text-slate-500" />;
      case 'users': return <Users className="h-5 w-5 mb-2 text-slate-500" />;
      case 'git-commit': return <GitCommit className="h-5 w-5 mb-2 text-slate-500" />;
      case 'database': return <Database className="h-5 w-5 mb-2 text-slate-500" />;
      case 'map': return <MapIcon className="h-5 w-5 mb-2 text-slate-500" />;
      default: return <Server className="h-5 w-5 mb-2 text-slate-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Templates
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-4" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm">Diagram Templates</h4>
            <p className="text-xs text-slate-500 mt-1">Start with a pre-built structure</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onSelect(tpl.code)}
                className="flex flex-col items-center justify-center p-4 border rounded-lg bg-slate-50 dark:bg-[#1C1C1E] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="group-hover:text-lavender-500 transition-colors">
                  {getIcon(tpl.icon)}
                </div>
                <span className="text-xs font-medium text-center">{tpl.name}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

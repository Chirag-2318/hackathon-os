import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, MapPin, MoreHorizontal, Plus } from 'lucide-react';

interface CreateEventPopoverProps {
  children: React.ReactNode;
  defaultDate?: Date;
  onAdd: (eventData: any) => void;
}

export function CreateEventPopover({ children, defaultDate, onAdd }: CreateEventPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');

  const handleAdd = () => {
    onAdd({ title, date: defaultDate });
    setOpen(false);
    setTitle('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4 bg-surface-raised r-pop border-border shadow-e2">
        <Input
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-ink-muted/50 mb-4"
        />

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-ink-muted">
            <Calendar className="h-4 w-4" />
            <span>{defaultDate ? defaultDate.toLocaleDateString() : 'Select date'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-muted">
            <MapPin className="h-4 w-4" />
            <span>Add location</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Badge variant="secondary" className="r-chip bg-lav-100 text-lav-900 font-semibold cursor-pointer">
            Phase Work
          </Badge>
          <Badge variant="secondary" className="r-chip bg-surface-sunken text-ink font-semibold cursor-pointer">
            Checkpoint
          </Badge>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Avatar className="h-8 w-8">
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <Avatar className="h-8 w-8">
            <AvatarFallback>I</AvatarFallback>
          </Avatar>
          <button className="h-8 w-8 rounded-full border border-dashed border-border flex items-center justify-center text-ink-muted hover:bg-surface-sunken">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
          <button className="text-ink-muted hover:text-ink h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-sunken">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <Button className="bg-[#2A2D32] hover:bg-black text-white r-control px-6" onClick={handleAdd}>
            Add
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

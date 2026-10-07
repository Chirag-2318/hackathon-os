import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, MoreVertical, Plus } from "lucide-react"
import { AvatarStack } from "./avatar-stack"
import { Chip } from "./chip"

export interface EventFormPopoverProps {
  children: React.ReactNode // the trigger
}

export function EventFormPopover({ children }: EventFormPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 rounded-pop bg-surface-raised shadow-e2 border-none">
        <div className="flex flex-col">
          <div className="p-4 border-b border-border-strong space-y-4">
            <input
              type="text"
              placeholder="Event title"
              className="w-full bg-transparent text-h3 font-bold text-ink placeholder:text-ink-muted focus:outline-none"
            />
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-ink-muted">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="text-body font-medium">Tue, 24 Sep</span>
              </div>
              <div className="flex items-center gap-3 text-ink-muted">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="text-body font-medium">10:00 AM - 11:30 AM</span>
              </div>
              <div className="flex items-center gap-3 text-ink-muted">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-body font-medium">Main Stage</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip variant="solid">Required</Chip>
              <Chip variant="soft">Pitch</Chip>
            </div>

            <div className="flex items-center gap-2">
              <AvatarStack 
                users={[
                  { id: "1", name: "Alice", src: "https://i.pravatar.cc/150?u=1", initials: "A" },
                  { id: "2", name: "Bob", src: "https://i.pravatar.cc/150?u=2", initials: "B" },
                ]}
                size="sm"
              />
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border-strong text-ink-muted hover:bg-black/5 hover:text-ink transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="p-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="text-ink-muted hover:text-ink">
              <MoreVertical className="h-4 w-4" />
            </Button>
            <Button variant="default" className="w-[120px]">
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

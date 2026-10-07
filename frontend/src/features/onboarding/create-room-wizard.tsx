import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/primitives/stepper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Chip } from '@/components/primitives/chip';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchEventTemplates, suggestRoomName } from '@/api/client';
import { roomApi } from '../room/api';
import { ROUTES } from '@/shared/constants/routes';

export function CreateRoomWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSpeedMode = searchParams.get('mode') === 'speed';

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [rulesMode, setRulesMode] = useState<'text' | 'link'>('text');
  const [roomName, setRoomName] = useState<string>('');
  const [teamSize, setTeamSize] = useState<string>('4');

  const { data: templates } = useQuery({
    queryKey: ['event-templates'],
    queryFn: fetchEventTemplates,
  });

  const { mutate: suggestName } = useMutation({
    mutationFn: suggestRoomName,
    onSuccess: (data) => {
      if (!roomName) setRoomName(data.suggestion);
    }
  });

  const { mutate: submitRoom, isPending } = useMutation({
    mutationFn: (data: { roomName: string; template: string; teamSize: string }) => 
      roomApi.createRoom({ name: data.roomName }),
    onSuccess: (data) => {
      // Trigger M01 View Transition
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          navigate(`/app/room/${data.id}/overview`);
        });
      } else {
        navigate(`/app/room/${data.id}/overview`);
      }
    }
  });

  useEffect(() => {
    if (isSpeedMode) {
      suggestName();
    }
  }, [isSpeedMode, suggestName]);

  const steps = isSpeedMode
    ? ['Event Details', 'Confirm']
    : ['Event Details', 'Time & Schedule', 'Team Setup', 'Confirm'];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitRoom({ template: selectedTemplate, roomName, teamSize });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate(ROUTES.SITUATION);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6 bg-canvas">
      <Card className="w-full max-w-[600px] p-6 shadow-e3 relative overflow-hidden" data-slot="dialog-in-page">
        <div className="mb-8">
          <Stepper 
            steps={steps.map(label => ({ label }))} 
            currentStep={currentStep} 
          />
        </div>

        <div className="min-h-[300px] flex flex-col">
          {/* Step 1: Event Details (Standard & Speed) */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-h3 text-ink-strong">What kind of event is this?</h2>
              
              <div className="space-y-3">
                <Label>Event Template</Label>
                <div className="flex flex-wrap gap-2">
                  {templates?.map(t => (
                    <Chip
                      key={t.id}
                      variant={selectedTemplate === t.id ? 'solid' : 'soft'}
                      onClick={() => setSelectedTemplate(t.id)}
                      className="cursor-pointer"
                    >
                      {t.name}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Rules & Brief</Label>
                  <SegmentedControl>
                    <SegmentedControlItem 
                      active={rulesMode === 'text'} 
                      onClick={() => setRulesMode('text')}
                    >
                      Paste Text
                    </SegmentedControlItem>
                    <SegmentedControlItem 
                      active={rulesMode === 'link'} 
                      onClick={() => setRulesMode('link')}
                    >
                      Paste Link
                    </SegmentedControlItem>
                  </SegmentedControl>
                </div>
                {rulesMode === 'text' ? (
                  <textarea
                    className="w-full h-24 rounded-control border border-border p-3 text-sm focus:border-lav-500 outline-none resize-none bg-surface"
                    placeholder="Paste the hackathon rules or prompt here..."
                  />
                ) : (
                  <Input placeholder="https://..." />
                )}
              </div>
            </div>
          )}

          {/* Step 2 (Standard): Time & Schedule */}
          {!isSpeedMode && currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-h3 text-ink-strong">When does it happen?</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="datetime-local" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input defaultValue="UTC (Coordinated Universal Time)" disabled />
              </div>

              {/* Placeholder for Clock Strip */}
              <div className="p-4 border border-border rounded-card bg-surface-hover mt-4">
                <p className="text-sm font-medium text-ink-muted mb-2">Schedule Preview</p>
                <div className="h-8 bg-lav-100 rounded-control flex items-center px-3 text-xs text-lav-800">
                  Clock strip component goes here
                </div>
              </div>
            </div>
          )}

          {/* Step 3 (Standard): Team Setup */}
          {!isSpeedMode && currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-h3 text-ink-strong">Set up your team</h2>
              
              <div className="space-y-2">
                <Label htmlFor="room-name">Room Name</Label>
                <Input 
                  id="room-name"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="e.g. Team Alpha"
                />
              </div>

              <div className="space-y-2">
                <Label>Team Size</Label>
                <SegmentedControl>
                  {[
                    { label: 'Solo', value: '1' },
                    { label: '2-4', value: '4' },
                    { label: '5-6', value: '6' },
                    { label: '7+', value: '8' }
                  ].map(opt => (
                    <SegmentedControlItem 
                      key={opt.value}
                      active={teamSize === opt.value}
                      onClick={() => setTeamSize(opt.value)}
                    >
                      {opt.label}
                    </SegmentedControlItem>
                  ))}
                </SegmentedControl>
              </div>

              <div className="space-y-2">
                <Label>Invite Link</Label>
                <div className="flex gap-2">
                  <Input defaultValue="https://hackathon-os.app/invite/abc-123" readOnly className="text-ink-muted" />
                  <Button variant="outline">Copy</Button>
                </div>
              </div>
            </div>
          )}

          {/* Final Step: Confirm (Step 4 for Standard, Step 2 for Speed) */}
          {((!isSpeedMode && currentStep === 3) || (isSpeedMode && currentStep === 1)) && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-h3 text-ink-strong">Review & Create</h2>
              
              <div className="rounded-card border border-border p-5 bg-surface space-y-4" style={{ viewTransitionName: 'room-header-target' }}>
                <div>
                  <p className="text-xs text-ink-muted uppercase tracking-wider mb-1">Room Name</p>
                  <p className="text-body font-medium">{roomName || (isSpeedMode ? 'Speed Room' : 'Unnamed Room')}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted uppercase tracking-wider mb-1">Template</p>
                  <p className="text-body">{templates?.find(t => t.id === selectedTemplate)?.name || 'Not selected'}</p>
                </div>
                {!isSpeedMode && (
                  <div>
                    <p className="text-xs text-ink-muted uppercase tracking-wider mb-1">Team Size</p>
                    <p className="text-body">{teamSize === '1' ? 'Solo' : `${teamSize} members`}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-border flex justify-between">
          <Button variant="ghost" onClick={handleBack}>
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={currentStep === 0 && !selectedTemplate || isPending}
          >
            {currentStep === steps.length - 1 ? (isPending ? 'Creating...' : 'Create Room') : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

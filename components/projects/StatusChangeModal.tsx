import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Clock, PauseCircle, XCircle, X } from 'lucide-react';
import { ProjectStatusPill } from './ProjectStatusPill';

interface StatusChangeModalProps {
  currentStatus: 'Active' | 'Planned' | 'On Hold' | 'Closed';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: string, reason: string) => void;
}

const statusOptions = [
  {
    value: 'Active',
    label: 'Active',
    description: 'Project is actively being worked on',
    icon: CheckCircle2,
  },
  {
    value: 'Planned',
    label: 'Planned',
    description: 'Project is planned but not yet started',
    icon: Clock,
  },
  {
    value: 'On Hold',
    label: 'On Hold',
    description: 'Project is temporarily paused',
    icon: PauseCircle,
  },
  {
    value: 'Closed',
    label: 'Closed',
    description: 'Project has been completed or cancelled',
    icon: XCircle,
  },
];

export function StatusChangeModal({
  currentStatus,
  isOpen,
  onClose,
  onConfirm,
}: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedStatus && reason.trim()) {
      onConfirm(selectedStatus, reason.trim());
      setReason('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedStatus(currentStatus);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-md p-6">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-[18px] font-medium text-foreground mb-4">
          Change Project Status
        </h3>

        <div className="space-y-3 mb-4">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedStatus === option.value;

            return (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border-[0.5px] transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <Icon className={`h-5 w-5 mt-0.5 ${
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <div className="text-left">
                  <p className="text-[14px] font-medium text-foreground">
                    {option.label}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="ml-auto h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-[13px] font-medium text-foreground">
            Reason for this change <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="Enter the reason for changing the status..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-[13px]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!reason.trim()}>
            Change Status
          </Button>
        </div>
      </div>
    </div>
  );
}

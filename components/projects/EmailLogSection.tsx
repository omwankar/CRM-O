import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, Check, ExternalLink, Copy } from 'lucide-react';
import { ProjectEmail } from '@/types/projects';
import { useState } from 'react';

interface EmailLogSectionProps {
  emails: ProjectEmail[];
  linkedEmail?: string | null;
  canLink?: boolean;
  onLinkEmail?: (email: string) => void;
  onMarkAsRead?: (emailId: string) => void;
}

export function EmailLogSection({
  emails,
  linkedEmail,
  canLink = false,
  onLinkEmail,
  onMarkAsRead,
}: EmailLogSectionProps) {
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');

  const handleCopyEmail = () => {
    if (linkedEmail) {
      navigator.clipboard.writeText(linkedEmail);
    }
  };

  const handleLinkEmail = () => {
    if (newEmail && onLinkEmail) {
      onLinkEmail(newEmail);
      setNewEmail('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Linked Email Section */}
      <div className="p-3 rounded-lg border-[0.5px] border-border bg-muted/20">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-[14px] font-medium text-foreground">Linked Email</h4>
        </div>

        {linkedEmail ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[13px] text-muted-foreground bg-background px-2 py-1 rounded">
              {linkedEmail}
            </code>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyEmail}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : canLink ? (
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-[13px]"
            />
            <Button size="sm" onClick={handleLinkEmail}>
              Link Email
            </Button>
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">No email linked</p>
        )}
      </div>

      {/* Email Log */}
      <div>
        <h4 className="text-[14px] font-medium text-foreground mb-3">
          Email Log
        </h4>

        {emails.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            No emails yet — emails sent to {linkedEmail || 'linked address'} will appear here
          </p>
        ) : (
          <div className="space-y-2">
            {emails.map((email) => (
              <div
                key={email.id}
                className="border-[0.5px] border-border rounded-lg overflow-hidden"
              >
                {/* Email Header */}
                <div
                  className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedEmailId(expandedEmailId === email.id ? null : email.id)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-[12px]">
                      {email.sender_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'EM'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {email.sender_name}
                      </p>
                      {!email.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {email.sender_email}
                    </p>
                    <p className="text-[13px] text-foreground mt-1 truncate">
                      {email.subject}
                    </p>
                  </div>

                  <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(email.received_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Email Body (Expanded) */}
                {expandedEmailId === email.id && (
                  <div className="p-3 border-t-[0.5px] border-border bg-muted/20">
                    <p className="text-[13px] text-foreground whitespace-pre-wrap break-words">
                      {email.full_body || email.body_preview}
                    </p>

                    {!email.is_read && onMarkAsRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(email.id);
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

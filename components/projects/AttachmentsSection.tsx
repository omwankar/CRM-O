import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FileImage, FileSpreadsheet, X, Upload } from 'lucide-react';
import { ProjectAttachment } from '@/types/projects';

interface AttachmentsSectionProps {
  attachments: ProjectAttachment[];
  canUpload?: boolean;
  onUpload?: (files: File[]) => void;
  onDelete?: (attachmentId: string) => void;
}

const fileIcons = {
  'application/pdf': { icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-500/10' },
  'image/png': { icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'image/jpeg': { icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'image/jpg': { icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

function getFileIcon(type: string) {
  return fileIcons[type as keyof typeof fileIcons] || { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-500/10' };
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function AttachmentsSection({
  attachments,
  canUpload = false,
  onUpload,
  onDelete,
}: AttachmentsSectionProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onUpload) {
      onUpload(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] font-medium text-foreground">Attachments</h4>
        {canUpload && onUpload && (
          <label>
            <input
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
            <Button variant="ghost" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </span>
            </Button>
          </label>
        )}
      </div>

      {attachments.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-[13px] text-muted-foreground">
            No attachments yet
          </p>
          {canUpload && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Upload PDF, DOCX, XLSX, PNG, or JPG files
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => {
            const iconConfig = getFileIcon(attachment.file_type);
            const Icon = iconConfig.icon;

            return (
              <Badge
                key={attachment.id}
                variant="secondary"
                className={`${iconConfig.bg} ${iconConfig.color} hover:bg-opacity-80 transition-colors`}
              >
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="max-w-[150px] truncate">{attachment.file_name}</span>
                  <span className="text-[10px] opacity-70">
                    ({formatFileSize(attachment.file_size)})
                  </span>
                </a>
                {canUpload && onDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(attachment.id);
                    }}
                    className="ml-1 hover:bg-white/20 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

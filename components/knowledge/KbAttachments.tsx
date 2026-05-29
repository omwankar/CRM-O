'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CanWrite } from '@/components/auth/Can';
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { deleteKbAttachment, uploadKbAttachmentFile } from '@/lib/api/knowledge';
import type { KbArticleAttachment } from '@/types/workplace';

function formatSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

function downloadAttachment(path: string) {
  const { data } = supabase.storage.from('documents').getPublicUrl(path);
  window.open(data.publicUrl, '_blank');
}

export function KbAttachments({
  articleId,
  attachments,
  invalidateKey,
}: {
  articleId: string;
  attachments: KbArticleAttachment[];
  invalidateKey: unknown[];
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: invalidateKey });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteKbAttachment(id),
    onSuccess: () => {
      toast.success('Attachment removed');
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadKbAttachmentFile(articleId, file);
      }
      toast.success('Attachment uploaded');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-sm font-semibold">Attachments</h2>
        <CanWrite>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </CanWrite>
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents attached yet.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-md border p-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.file_name}</p>
                  {a.size_bytes ? (
                    <p className="text-xs text-muted-foreground">{formatSize(a.size_bytes)}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadAttachment(a.storage_path)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <CanWrite>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove attachment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {a.file_name} will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-rose-600 hover:bg-rose-700"
                          onClick={() => deleteMut.mutate(a.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CanWrite>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

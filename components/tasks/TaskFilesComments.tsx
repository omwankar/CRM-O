'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Paperclip, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addTaskAttachment, deleteTaskAttachment, getTaskAttachments } from '@/lib/api/tasks';
import { createComment, getComments } from '@/lib/api/comments';
import { pickFiles, resolveStorageUrl, uploadCrmFile } from '@/lib/api/storage';
import { formatUkDateTime } from '@/lib/date';

export function TaskFilesComments({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: commentsData } = useQuery({
    queryKey: ['comments', 'tasks', taskId],
    queryFn: () => getComments({ related_table: 'tasks', related_id: taskId, limit: 100 }),
    enabled: !!taskId,
  });

  const { data: filesData } = useQuery({
    queryKey: ['task-attachments', taskId],
    queryFn: () => getTaskAttachments(taskId),
    enabled: !!taskId,
  });

  const comments = commentsData?.data || [];
  const files = filesData?.data || [];

  const commentMut = useMutation({
    mutationFn: (body: string) => createComment({ body, related_table: 'tasks', related_id: taskId }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['comments', 'tasks', taskId] });
      toast.success('Comment added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteFileMut = useMutation({
    mutationFn: (aid: string) => deleteTaskAttachment(taskId, aid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-attachments', taskId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  async function onFiles(list: File[]) {
    if (!list.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        const uploaded = await uploadCrmFile(`tasks/${taskId}`, file);
        await addTaskAttachment(taskId, {
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_url: uploaded.path,
          file_size: file.size,
        });
      }
      await qc.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      toast.success('File uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-4 border-t pt-3">
      <div className="grid gap-1.5">
        <p className="text-sm font-medium">Documents</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit px-0 text-primary"
          disabled={uploading}
          onClick={async () => {
            const files = await pickFiles({ multiple: true });
            await onFiles(files);
          }}
        >
          <Paperclip className="h-4 w-4" />
          {uploading ? 'Uploading…' : 'Upload file'}
        </Button>
        {files.length === 0 ? (
          <p className="text-xs text-muted-foreground">No files yet.</p>
        ) : (
          <ul className="space-y-1">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 text-sm">
                <button
                  type="button"
                  className="truncate text-left text-primary underline-offset-2 hover:underline"
                  onClick={async () => window.open(await resolveStorageUrl(f.file_url), '_blank')}
                >
                  {f.file_name}
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Remove this file?')) deleteFileMut.mutate(f.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-1.5">
        <p className="text-sm font-medium">Comments</p>
        <ul className="max-h-40 space-y-2 overflow-y-auto">
          {comments.length === 0 ? (
            <li className="text-xs text-muted-foreground">No comments yet.</li>
          ) : (
            comments.map((c: any) => (
              <li key={c.id} className="rounded-md border p-2 text-sm">
                <p>{c.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {c.author?.full_name || c.author?.email || 'User'}
                  {c.created_at ? ` · ${formatUkDateTime(c.created_at)}` : ''}
                </p>
              </li>
            ))
          )}
        </ul>
        <Textarea
          rows={2}
          placeholder="Add a comment…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          disabled={!comment.trim() || commentMut.isPending}
          onClick={() => commentMut.mutate(comment.trim())}
        >
          Add comment
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Folder, Paperclip, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  addTaskAttachment,
  deleteTaskAttachment,
  getTaskAttachments,
  type TaskAttachment,
} from '@/lib/api/tasks';
import { createComment, getComments } from '@/lib/api/comments';
import {
  fileNameFromFolderPick,
  folderNameFromFile,
  pickFiles,
  pickFolder,
  resolveStorageUrl,
  uploadCrmFile,
} from '@/lib/api/storage';
import { formatUkDateTime } from '@/lib/date';

const OTHER_FOLDER = 'Other files';

function attachmentFolder(f: TaskAttachment) {
  if (f.folder?.trim()) return f.folder.trim();
  const name = f.file_name || '';
  const slash = name.indexOf('/');
  if (slash > 0) return name.slice(0, slash);
  return OTHER_FOLDER;
}

function attachmentDisplayName(f: TaskAttachment) {
  if (f.folder?.trim()) return f.file_name;
  const name = f.file_name || '';
  const slash = name.indexOf('/');
  if (slash > 0) return name.slice(slash + 1);
  return name;
}

function groupAttachments(files: TaskAttachment[]) {
  const map = new Map<string, TaskAttachment[]>();
  for (const f of files) {
    const key = attachmentFolder(f);
    const list = map.get(key) || [];
    list.push(f);
    map.set(key, list);
  }
  return [...map.entries()].sort((a, b) => {
    if (a[0] === OTHER_FOLDER) return 1;
    if (b[0] === OTHER_FOLDER) return -1;
    return a[0].localeCompare(b[0]);
  });
}

export function TaskFilesComments({
  taskId,
  showComments = true,
}: {
  taskId: string;
  showComments?: boolean;
}) {
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  const { data: commentsData } = useQuery({
    queryKey: ['comments', 'tasks', taskId],
    queryFn: () => getComments({ related_table: 'tasks', related_id: taskId, limit: 100 }),
    enabled: !!taskId && showComments,
  });

  const { data: filesData } = useQuery({
    queryKey: ['task-attachments', taskId],
    queryFn: () => getTaskAttachments(taskId),
    enabled: !!taskId,
  });

  const comments = commentsData?.data || [];
  const files = filesData?.data || [];
  const groups = groupAttachments(files);

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

  async function uploadList(list: File[], fromFolder: boolean) {
    if (!list.length) return;
    setUploading(true);
    let ok = 0;
    try {
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const label = `Uploading ${i + 1} of ${list.length}…`;
        setProgress(label);
        toast.loading(label, { id: 'task-upload' });
        const folder = fromFolder ? folderNameFromFile(file) : null;
        const fileName = fromFolder ? fileNameFromFolderPick(file) : file.name;
        const uploaded = await uploadCrmFile(`tasks/${taskId}`, file);
        await addTaskAttachment(taskId, {
          file_name: fileName,
          file_type: file.type || 'application/octet-stream',
          file_url: uploaded.path,
          file_size: file.size,
          folder,
        });
        ok += 1;
      }
      await qc.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      toast.success(ok === 1 ? 'File uploaded' : `${ok} files uploaded`, { id: 'task-upload' });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed', { id: 'task-upload' });
    } finally {
      setUploading(false);
      setProgress('');
    }
  }

  return (
    <div className={showComments ? 'grid gap-4 border-t pt-3' : 'grid gap-3'}>
      <div className="grid gap-2">
        <p className="text-sm font-medium">Documents</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={async () => {
              const picked = await pickFiles({ multiple: true });
              await uploadList(picked, false);
            }}
          >
            <Paperclip className="h-4 w-4" />
            Upload files
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={async () => {
              const picked = await pickFolder();
              await uploadList(picked, true);
            }}
          >
            <Folder className="h-4 w-4" />
            Upload folder
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload a whole invoice folder, then click Upload folder again for the next one.
        </p>
        {uploading && progress ? (
          <p className="text-xs text-muted-foreground">{progress}</p>
        ) : null}
        {files.length === 0 ? (
          <p className="text-xs text-muted-foreground">No files yet.</p>
        ) : (
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {groups.map(([folder, items]) => (
              <div key={folder} className="rounded-lg border p-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                    <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{folder}</span>
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? 'file' : 'files'}
                  </span>
                </div>
                <ul className="space-y-1">
                  {items.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2 text-sm">
                      <button
                        type="button"
                        className="truncate text-left text-primary underline-offset-2 hover:underline"
                        onClick={async () => window.open(await resolveStorageUrl(f.file_url), '_blank')}
                      >
                        {attachmentDisplayName(f)}
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          if (confirm('Remove this file?')) deleteFileMut.mutate(f.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {showComments ? (
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
      ) : null}
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, FileText, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { createKbArticle, uploadKbAttachmentFile } from '@/lib/api/knowledge';
import {
  KbArticleForm,
  emptyKbArticleForm,
  kbFormToPayload,
  type KbArticleFormValues,
} from '@/components/knowledge/KbArticleForm';

function formatSize(bytes: number) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

export default function NewKbArticlePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<KbArticleFormValues>(emptyKbArticleForm);
  const [files, setFiles] = useState<File[]>([]);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error('Enter a title');
      const article = await createKbArticle(kbFormToPayload(form));
      if (files.length > 0) {
        for (const file of files) {
          await uploadKbAttachmentFile(article.id, file);
        }
      }
      return article;
    },
    onSuccess: (article) => {
      toast.success('Article saved');
      router.push(`/dashboard/knowledge/${article.slug}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addFiles = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setFiles((prev) => [...prev, ...Array.from(selected)]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => router.push('/dashboard/knowledge')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <h1 className="text-3xl font-bold">New article</h1>
      <Card className="p-6">
        <KbArticleForm value={form} onChange={setForm} />

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4 mb-2">
            <label className="text-sm font-medium">Attachments</label>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Add files
            </Button>
          </div>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Attach documents to upload when the article is saved.
            </p>
          ) : (
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-md border p-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => removeFile(index)}
                    disabled={createMut.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save article
          </Button>
        </div>
      </Card>
    </div>
  );
}

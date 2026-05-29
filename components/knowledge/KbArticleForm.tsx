'use client';

import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getKbCategories } from '@/lib/api/knowledge';
import type { CreateKbArticleInput } from '@/types/workplace';

export type KbArticleFormValues = {
  title: string;
  category_id: string;
  summary: string;
  tags: string;
  content: string;
  status: 'draft' | 'published';
};

export const emptyKbArticleForm: KbArticleFormValues = {
  title: '',
  category_id: '',
  summary: '',
  tags: '',
  content: '',
  status: 'draft',
};

export function kbFormToPayload(v: KbArticleFormValues): CreateKbArticleInput {
  return {
    title: v.title.trim(),
    category_id: v.category_id || null,
    summary: v.summary.trim() || null,
    content: v.content,
    status: v.status,
    tags: v.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

export function KbArticleForm({
  value,
  onChange,
}: {
  value: KbArticleFormValues;
  onChange: (v: KbArticleFormValues) => void;
}) {
  const { data: catsData } = useQuery({
    queryKey: ['kb-categories'],
    queryFn: getKbCategories,
  });
  const categories = catsData?.data || [];

  const set = <K extends keyof KbArticleFormValues>(key: K, val: KbArticleFormValues[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Title</label>
        <Input value={value.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Category</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={value.category_id}
            onChange={(e) => set('category_id', e.target.value)}
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Status</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={value.status}
            onChange={(e) => set('status', e.target.value as 'draft' | 'published')}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Summary</label>
        <Input value={value.summary} onChange={(e) => set('summary', e.target.value)} placeholder="Short description" />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Tags (comma separated)</label>
        <Input value={value.tags} onChange={(e) => set('tags', e.target.value)} placeholder="onboarding, shipping, tips" />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Content</label>
        <Textarea
          rows={16}
          value={value.content}
          onChange={(e) => set('content', e.target.value)}
          placeholder="Write the procedure, trick, or company info here…"
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}

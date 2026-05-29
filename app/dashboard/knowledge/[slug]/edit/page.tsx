'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getKbArticle, updateKbArticle } from '@/lib/api/knowledge';
import {
  KbArticleForm,
  emptyKbArticleForm,
  kbFormToPayload,
  type KbArticleFormValues,
} from '@/components/knowledge/KbArticleForm';
import { KbAttachments } from '@/components/knowledge/KbAttachments';

export default function EditKbArticlePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [form, setForm] = useState<KbArticleFormValues>(emptyKbArticleForm);

  const { data: article, isLoading } = useQuery({
    queryKey: ['kb-article', slug],
    queryFn: () => getKbArticle(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    if (article) {
      setForm({
        title: article.title,
        category_id: article.category_id || '',
        summary: article.summary || '',
        tags: (article.tags || []).join(', '),
        content: article.content || '',
        status: article.status,
      });
    }
  }, [article]);

  const saveMut = useMutation({
    mutationFn: () => {
      if (!form.title.trim()) throw new Error('Enter a title');
      return updateKbArticle(article!.id, kbFormToPayload(form));
    },
    onSuccess: (updated) => {
      toast.success('Article updated');
      router.push(`/dashboard/knowledge/${updated.slug}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !article) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => router.push(`/dashboard/knowledge/${article.slug}`)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <h1 className="text-3xl font-bold">Edit article</h1>
      <Card className="p-6">
        <KbArticleForm value={form} onChange={setForm} />
        <div className="mt-6 flex justify-end">
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save changes
          </Button>
        </div>
      </Card>

      <KbAttachments
        articleId={article.id}
        attachments={article.attachments ?? []}
        invalidateKey={['kb-article', slug]}
      />
    </div>
  );
}

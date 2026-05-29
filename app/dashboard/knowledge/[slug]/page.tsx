'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getKbArticle, deleteKbArticle } from '@/lib/api/knowledge';
import { KbAttachments } from '@/components/knowledge/KbAttachments';

export default function KbArticlePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const { data: article, isLoading } = useQuery({
    queryKey: ['kb-article', slug],
    queryFn: () => getKbArticle(slug!),
    enabled: !!slug,
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteKbArticle(article!.id),
    onSuccess: () => {
      toast.success('Article deleted');
      qc.invalidateQueries({ queryKey: ['kb-articles'] });
      router.push('/dashboard/knowledge');
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
      <Button variant="ghost" onClick={() => router.push('/dashboard/knowledge')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to knowledge base
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{article.title}</h1>
            {article.status === 'draft' ? <Badge variant="outline">Draft</Badge> : null}
          </div>
          {article.summary ? <p className="text-muted-foreground mt-1">{article.summary}</p> : null}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {article.tags?.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>
        <CanWrite>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/knowledge/${article.slug}/edit`)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete article?</AlertDialogTitle>
                  <AlertDialogDescription>This article will be removed from the knowledge base.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => deleteMut.mutate()}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CanWrite>
      </div>

      <Card className="p-6">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{article.content || 'No content yet.'}</div>
      </Card>

      <KbAttachments
        articleId={article.id}
        attachments={article.attachments ?? []}
        invalidateKey={['kb-article', slug]}
      />
    </div>
  );
}

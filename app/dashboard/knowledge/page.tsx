'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CanWrite } from '@/components/auth/Can';
import { BookOpen, Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  getKbArticles,
  getKbCategories,
  createKbCategory,
} from '@/lib/api/knowledge';

export default function KnowledgeBasePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('');
  const [newCat, setNewCat] = useState('');

  const { data: catsData } = useQuery({ queryKey: ['kb-categories'], queryFn: getKbCategories });
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['kb-articles', search, activeCat],
    queryFn: () => getKbArticles({ search: search || undefined, category_id: activeCat || undefined }),
  });

  const addCatMut = useMutation({
    mutationFn: () => createKbCategory({ name: newCat.trim() }),
    onSuccess: () => {
      toast.success('Category added');
      setNewCat('');
      qc.invalidateQueries({ queryKey: ['kb-categories'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const categories = catsData?.data || [];
  const articles = articlesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground">Company procedures, working tricks and useful references.</p>
        </div>
        <CanWrite>
          <Button onClick={() => router.push('/dashboard/knowledge/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New article
          </Button>
        </CanWrite>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 space-y-2">
          <Card className="p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-2 mb-2">Categories</p>
            <button
              onClick={() => setActiveCat('')}
              className={`w-full text-left text-sm px-2 py-1.5 rounded ${activeCat === '' ? 'bg-muted font-medium' : 'hover:bg-muted'}`}
            >
              All articles
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded ${activeCat === c.id ? 'bg-muted font-medium' : 'hover:bg-muted'}`}
              >
                {c.name}
              </button>
            ))}
            <CanWrite>
              <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className="h-8 text-sm" />
                <Button size="sm" variant="outline" disabled={!newCat.trim() || addCatMut.isPending} onClick={() => addCatMut.mutate()}>
                  Add
                </Button>
              </div>
            </CanWrite>
          </Card>
        </aside>

        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : articles.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">No articles found</Card>
          ) : (
            <div className="grid gap-3">
              {articles.map((a) => (
                <Link key={a.id} href={`/dashboard/knowledge/${a.slug}`}>
                  <Card className="p-4 hover:border-foreground/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold">{a.title}</h3>
                        {a.summary ? <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.summary}</p> : null}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {a.tags?.map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      </div>
                      {a.status === 'draft' ? <Badge variant="outline">Draft</Badge> : null}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getDocuments, deleteDocument } from '@/lib/api/documents';
import { supabase } from '@/lib/auth';
import { Plus, Search, Download, FileText, Trash2 } from 'lucide-react';

export default function DocumentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: documentsData, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      try {
        return await getDocuments({});
      } catch {
        // Fallback to direct Supabase fetch if backend documents route fails.
        const orderedResult = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (!orderedResult.error) {
          return { data: orderedResult.data || [] };
        }

        const plainResult = await supabase.from('documents').select('*');
        if (plainResult.error) throw new Error(plainResult.error.message || 'Failed to load documents');
        return { data: plainResult.data || [] };
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const documents = documentsData?.data || [];

  const filteredDocuments = search
    ? documents.filter(
        (doc: any) =>
          (doc.file_name || doc.document_name)?.toLowerCase().includes(search.toLowerCase()) ||
          doc.module?.toLowerCase().includes(search.toLowerCase())
      )
    : documents;

  const downloadFile = (path: string) => {
    const { supabase } = require('@/lib/auth');
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  };

  const handleDelete = (doc: any) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(doc.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage document uploads and tracking</p>
        </div>
        <Button onClick={() => router.push('/dashboard/documents/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by document name or module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <Card key={i} className="p-6 animate-pulse h-24" />)}
        </div>
      ) : error ? (
        <Card className="p-6">
          <p className="text-sm text-destructive">
            Failed to load documents: {(error as Error)?.message || 'Please refresh the page.'}
          </p>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documents yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc: any) => (
            <Card key={doc.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{doc.file_name || doc.document_name || 'Untitled document'}</h3>
                  <p className="text-sm text-muted-foreground">Module: {doc.module || doc.related_table || '-'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => downloadFile(doc.file_url)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getDocument, updateDocument } from '@/lib/api/documents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    document_name: '',
    module: '',
    file_path: '',
    expiry_date: '',
  });

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const data = await getDocument(id);
      if (data) {
        setFormData({
          document_name: data.document_name || data.file_name || '',
          module: data.module || data.related_table || data.document_type || '',
          file_path: data.file_path || data.file_url || '',
          expiry_date: data.expiry_date ? String(data.expiry_date).slice(0, 10) : '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch document');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await updateDocument(id, {
        document_name: formData.document_name,
        file_name: formData.document_name,
        module: formData.module,
        related_table: formData.module,
        expiry_date: formData.expiry_date || null,
      });
      router.push('/dashboard/documents');
    } catch (err: any) {
      setError(err.message || 'Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/documents" className="flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Documents
      </Link>

      <Card className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Edit Document</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <FieldLabel htmlFor="document_name">Document Name *</FieldLabel>
            <Input
              id="document_name"
              name="document_name"
              value={formData.document_name}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="module">Module / category *</FieldLabel>
            <Input
              id="module"
              name="module"
              value={formData.module}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>File</FieldLabel>
            <Input
              disabled
              value={formData.file_path}
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-2">To replace the file, delete this document and upload a new one.</p>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="expiry_date">Expiry Date</FieldLabel>
            <Input
              id="expiry_date"
              name="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={handleChange}
            />
          </FieldGroup>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href="/dashboard/documents">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

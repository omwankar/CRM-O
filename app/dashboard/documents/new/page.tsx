'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createDocument } from '@/lib/api/documents';
import { uploadCrmFile } from '@/lib/api/storage';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { ArrowLeft, Upload } from 'lucide-react';

function friendlyUploadError(raw: string): string {
  const m = String(raw || '').toLowerCase();
  if (m.includes('row-level security') || m.includes('permission') || m.includes('forbidden')) {
    return 'You do not have permission to upload documents. Ask a manager or try again.';
  }
  if (m.includes('storage') || m.includes('bucket') || m.includes('payload too large')) {
    return 'Could not upload the file. Check the file size and try again.';
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('cannot reach')) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  return 'Upload failed. Please try again.';
}

export default function NewDocumentPage() {
  const router = useRouter();
  const { user, canWrite, isLoading } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [module, setModule] = useState('SOP');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setFileName(selected.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file');
      return;
    }
    if (!module.trim()) {
      setError('Please enter a module / category');
      return;
    }

    setLoading(true);
    try {
      const uploaded = await uploadCrmFile('library', file);

      await createDocument({
        module: module.trim(),
        related_table: module.trim(),
        record_id: null,
        file_name: file.name,
        document_name: file.name,
        file_url: uploaded.path,
        file_path: uploaded.path,
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
        uploaded_by: user?.id,
      });

      router.push('/dashboard/documents');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(friendlyUploadError(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoading && !canWrite) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/documents" className="flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </Link>
        <p className="text-sm text-muted-foreground">You do not have permission to upload documents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/documents" className="flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Documents
      </Link>

      <Card className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Upload Document</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-950/40 dark:border-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <FieldLabel htmlFor="module">Module / category</FieldLabel>
            <Input
              id="module"
              placeholder="e.g. SOP, certifications, insurance"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="file">File Upload</FieldLabel>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <Input id="file" type="file" onChange={handleFileChange} required className="hidden" />
              <label htmlFor="file" className="cursor-pointer">
                <p className="text-sm text-muted-foreground mb-1">Click to select file</p>
                {fileName && <p className="text-sm text-primary font-medium">{fileName}</p>}
              </label>
            </div>
          </FieldGroup>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Document'}
            </Button>
            <Link href="/dashboard/documents">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

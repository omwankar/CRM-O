'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditCertificationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    certificate_file: '', // ✅ store file URL
  });

  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCertification();
  }, [id]);

  const fetchCertification = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('certifications')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setFormData({
          name: data.certification_name || '',
          issuer: data.issuing_authority || '',
          issue_date: data.issue_date || '',
          expiry_date: data.expiry_date || '',
          credential_id: data.credential_id || '',
          certificate_file: data.certificate_file || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch certification');
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
      let fileUrl = formData.certificate_file;

      // ✅ If new file uploaded
      if (file) {
        const fileName = `${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('certificates')
          .getPublicUrl(fileName);

        fileUrl = data.publicUrl;
      }

      // ✅ Update DB
      const { error: updateError } = await supabase
        .from('certifications')
        .update({
          certification_name: formData.name,
          issuing_authority: formData.issuer,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date,
          credential_id: formData.credential_id,
          certificate_file: fileUrl,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      router.push('/dashboard/certifications');
    } catch (err: any) {
      setError(err.message || 'Failed to update certification');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="page-shell">

      {/* Back */}
      <Link
        href="/dashboard/certifications"
        className="flex items-center gap-2 text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Certifications
      </Link>

      <Card className="surface-card max-w-2xl p-8">
        <h1 className="text-2xl font-bold mb-6">Edit Certification</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}
          <FieldGroup>
            <FieldLabel htmlFor="name">Certification Name *</FieldLabel>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          {/* Issuer */}
          <FieldGroup>
            <FieldLabel htmlFor="issuer">Issuer *</FieldLabel>
            <Input
              id="issuer"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldGroup>
              <FieldLabel htmlFor="issue_date">Issue Date *</FieldLabel>
              <Input
                id="issue_date"
                name="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={handleChange}
                required
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="expiry_date">Expiry Date *</FieldLabel>
              <Input
                id="expiry_date"
                name="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={handleChange}
                required
              />
            </FieldGroup>
          </div>

          {/* Credential ID */}
          <FieldGroup>
            <FieldLabel htmlFor="credential_id">Credential ID</FieldLabel>
            <Input
              id="credential_id"
              name="credential_id"
              value={formData.credential_id}
              onChange={handleChange}
            />
          </FieldGroup>

          {/* ✅ Current File */}
          {formData.certificate_file && (
            <div className="text-sm">
              <span className="text-muted-foreground">Current File: </span>
              <a
                href={formData.certificate_file}
                target="_blank"
                className="text-blue-500 underline"
              >
                View Certificate
              </a>
            </div>
          )}

          {/* ✅ Upload New File */}
          <FieldGroup>
            <FieldLabel htmlFor="file">Replace Certificate</FieldLabel>
            <Input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
            />
          </FieldGroup>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            <Link href="/dashboard/certifications">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>

        </form>
      </Card>
    </div>
  );
}
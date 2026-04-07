'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewCertificationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
  });

  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let fileUrl: string | null = null;

      // ✅ Upload file to Supabase Storage
      if (file) {
        const fileName = `${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('certificates') // bucket name
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // ✅ Get public URL
        const { data } = supabase.storage
          .from('certificates')
          .getPublicUrl(fileName);

        fileUrl = data.publicUrl;
      }

      // ✅ Insert into DB
      const { error: insertError } = await supabase
        .from('certifications')
        .insert([
          {
            certification_name: formData.name,
            issuing_authority: formData.issuer,
            issue_date: formData.issue_date,
            expiry_date: formData.expiry_date,
            credential_id: formData.credential_id,
            certificate_file: fileUrl, // 🔥 saved file URL
          },
        ]);

      if (insertError) throw insertError;

      router.push('/dashboard/certifications');
    } catch (err: any) {
      setError(err.message || 'Failed to create certification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      {/* Back Button */}
      <Link
        href="/dashboard/certifications"
        className="flex items-center gap-2 text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Certifications
      </Link>

      <Card className="surface-card max-w-2xl p-8">
        <h1 className="text-2xl font-bold mb-6">Add New Certification</h1>

        {/* Error Message */}
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

          {/* ✅ File Upload */}
          <FieldGroup>
            <FieldLabel htmlFor="file">Upload Certificate</FieldLabel>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Certification'}
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
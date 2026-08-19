import { apiRequest } from '@/lib/api/client';
import { supabase } from '@/lib/auth';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type UploadedCrmFile = {
  path: string;
  url: string;
  file_name: string;
  mime_type: string;
  size: number;
};

type SignedUpload = {
  bucket: string;
  path: string;
  token: string;
  signedUploadUrl: string;
  url: string;
};

export async function resolveStorageUrl(pathOrUrl: string): Promise<string> {
  if (!pathOrUrl) return '#';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const { url } = (await apiRequest(`/storage/url?path=${encodeURIComponent(pathOrUrl)}`)) as { url: string };
  return url || '#';
}

export async function uploadCrmFile(folder: string, file: File): Promise<UploadedCrmFile> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File is too large (max 20 MB).');
  }

  const signed = (await apiRequest('/storage/signed-upload', {
    method: 'POST',
    body: JSON.stringify({
      folder,
      file_name: file.name,
      content_type: file.type || undefined,
    }),
  })) as SignedUpload;

  const { error } = await supabase.storage
    .from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, file, {
      contentType: file.type || 'application/octet-stream',
    });
  if (error) {
    throw new Error(error.message || 'Could not upload the file. Please try again.');
  }

  let url = signed.url;
  try {
    url = await resolveStorageUrl(signed.path);
  } catch {
    // keep public URL from signed-upload
  }

  return {
    path: signed.path,
    url,
    file_name: file.name,
    mime_type: file.type || 'application/octet-stream',
    size: file.size,
  };
}

const JUNK_FILE = /^(?:\.DS_Store|Thumbs\.db|desktop\.ini)$/i;

function isJunkFile(file: File) {
  return !file.name || JUNK_FILE.test(file.name);
}

function relativePath(file: File) {
  return String((file as File & { webkitRelativePath?: string }).webkitRelativePath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
}

/** Top-level folder from a directory pick, e.g. "Jan invoices/a.pdf" → "Jan invoices". */
export function folderNameFromFile(file: File): string | null {
  const parts = relativePath(file).split('/').filter(Boolean);
  return parts.length >= 2 ? parts[0] : null;
}

/** Path inside the top folder, e.g. "Jan invoices/vendor/a.pdf" → "vendor/a.pdf". */
export function fileNameFromFolderPick(file: File): string {
  const parts = relativePath(file).split('/').filter(Boolean);
  if (parts.length >= 2) return parts.slice(1).join('/');
  return file.name;
}

function hideAndPick(input: HTMLInputElement): Promise<File[]> {
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  return new Promise((resolve) => {
    const done = (files: File[]) => {
      input.remove();
      resolve(files.filter((f) => !isJunkFile(f)));
    };
    input.addEventListener('change', () => done(Array.from(input.files || [])));
    input.addEventListener('cancel', () => done([]));
    document.body.appendChild(input);
    input.click();
  });
}

export function pickFiles(options?: { multiple?: boolean; accept?: string }): Promise<File[]> {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = Boolean(options?.multiple);
  if (options?.accept) input.accept = options.accept;
  return hideAndPick(input);
}

/** Native folder picker. Files include webkitRelativePath so folder names can be kept. */
export function pickFolder(): Promise<File[]> {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.setAttribute('webkitdirectory', '');
  input.setAttribute('directory', '');
  (input as HTMLInputElement & { webkitdirectory: boolean }).webkitdirectory = true;
  return hideAndPick(input);
}

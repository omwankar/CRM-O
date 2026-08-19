import { apiRequest } from '@/lib/api/client';
import { uploadCrmFile } from '@/lib/api/storage';
import type {
  CreateKbArticleInput,
  KbArticle,
  KbArticleAttachment,
  KbArticleListItem,
  KbCategory,
} from '@/types/workplace';

export async function getKbCategories() {
  return apiRequest('/knowledge/categories') as Promise<{ data: KbCategory[] }>;
}

export async function createKbCategory(data: { name: string; parent_id?: string | null; sort_order?: number }) {
  return apiRequest('/knowledge/categories', { method: 'POST', body: JSON.stringify(data) }) as Promise<KbCategory>;
}

export async function deleteKbCategory(id: string) {
  return apiRequest(`/knowledge/categories/${id}`, { method: 'DELETE' });
}

export async function getKbArticles(params?: { search?: string; category_id?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.category_id) q.set('category_id', params.category_id);
  if (params?.status) q.set('status', params.status);
  const query = q.toString();
  return apiRequest(`/knowledge/articles${query ? `?${query}` : ''}`) as Promise<{ data: KbArticleListItem[] }>;
}

export async function getKbArticle(slug: string) {
  return apiRequest(`/knowledge/articles/${slug}`) as Promise<KbArticle>;
}

export async function createKbArticle(data: CreateKbArticleInput) {
  return apiRequest('/knowledge/articles', { method: 'POST', body: JSON.stringify(data) }) as Promise<KbArticle>;
}

export async function updateKbArticle(id: string, data: Partial<CreateKbArticleInput>) {
  return apiRequest(`/knowledge/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }) as Promise<KbArticle>;
}

export async function deleteKbArticle(id: string) {
  return apiRequest(`/knowledge/articles/${id}`, { method: 'DELETE' });
}

export async function addKbAttachment(
  articleId: string,
  data: { file_name: string; storage_path: string; mime_type?: string | null; size_bytes?: number | null },
) {
  return apiRequest(`/knowledge/articles/${articleId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }) as Promise<KbArticleAttachment>;
}

export async function deleteKbAttachment(attachmentId: string) {
  return apiRequest(`/knowledge/attachments/${attachmentId}`, { method: 'DELETE' });
}

/** Uploads a file to the documents storage bucket, then registers it on the article. */
export async function uploadKbAttachmentFile(articleId: string, file: File) {
  const uploaded = await uploadCrmFile(`kb/${articleId}`, file);
  return addKbAttachment(articleId, {
    file_name: file.name,
    storage_path: uploaded.path,
    mime_type: file.type || null,
    size_bytes: file.size,
  });
}

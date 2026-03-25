import { supabase } from '../supabaseClient';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Get the current auth token from Supabase session.
 */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Make an authenticated API request.
 */
async function apiFetch(path, options = {}) {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// Atlas Files API
// ============================================

/**
 * List published atlas files (public).
 */
export async function listPublishedAtlasFiles(options = {}) {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.fields) params.set('fields', options.fields);
  const qs = params.toString();
  const { data } = await apiFetch(`/api/atlas${qs ? `?${qs}` : ''}`);
  return data;
}

/**
 * List current user's atlas files.
 */
export async function listMyAtlasFiles() {
  const { data } = await apiFetch('/api/atlas/mine');
  return data;
}

/**
 * Get single atlas file with active version content.
 */
export async function getAtlasFile(id) {
  const { data } = await apiFetch(`/api/atlas/${id}`);
  return data;
}

/**
 * Create a new atlas file.
 */
export async function createAtlasFile(input) {
  const { data } = await apiFetch('/api/atlas', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data;
}

/**
 * Update atlas file metadata.
 */
export async function updateAtlasFile(id, input) {
  const { data } = await apiFetch(`/api/atlas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return data;
}

/**
 * Delete an atlas file.
 */
export async function deleteAtlasFile(id) {
  return apiFetch(`/api/atlas/${id}`, { method: 'DELETE' });
}

// ============================================
// Versions API
// ============================================

/**
 * List versions for an atlas file.
 */
export async function listVersions(atlasFileId) {
  const { data } = await apiFetch(`/api/atlas/${atlasFileId}/versions`);
  return data;
}

/**
 * Create a new draft version.
 */
export async function createVersion(atlasFileId) {
  const { data } = await apiFetch(`/api/atlas/${atlasFileId}/versions`, {
    method: 'POST',
  });
  return data;
}

/**
 * Update version content (days, activities, intro, tips).
 */
export async function updateVersion(atlasFileId, versionId, content) {
  const { data } = await apiFetch(`/api/atlas/${atlasFileId}/versions/${versionId}`, {
    method: 'PUT',
    body: JSON.stringify(content),
  });
  return data;
}

/**
 * Publish a draft version.
 */
export async function publishVersion(atlasFileId, versionId) {
  const { data } = await apiFetch(`/api/atlas/${atlasFileId}/versions/${versionId}/publish`, {
    method: 'POST',
  });
  return data;
}

// ============================================
// Forking API
// ============================================

/**
 * Fork an atlas file into user's itineraries.
 * Returns { itinerary_id, forked_from }.
 */
export async function forkAtlasFile(atlasFileId) {
  const { data } = await apiFetch(`/api/atlas/${atlasFileId}/fork`, {
    method: 'POST',
  });
  return data;
}

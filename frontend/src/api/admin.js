import { supabase } from '../supabaseClient';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function adminFetch(path, options = {}) {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}/api/admin${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Admin API request failed');
  }

  const json = await response.json();
  return json.data;
}

// Dashboard stats
export async function getAdminStats() {
  return adminFetch('/stats');
}

// Atlas files
export async function getPendingAtlasFiles() {
  return adminFetch('/atlas/pending');
}

export async function getAllAtlasFiles() {
  return adminFetch('/atlas/all');
}

export async function approveAtlasFile(id) {
  return adminFetch(`/atlas/${id}/approve`, { method: 'POST' });
}

export async function rejectAtlasFile(id) {
  return adminFetch(`/atlas/${id}/reject`, { method: 'POST' });
}

// Itineraries
export async function getPendingItineraries() {
  return adminFetch('/itineraries/pending');
}

export async function approveItinerary(id) {
  return adminFetch(`/itineraries/${id}/approve`, { method: 'POST' });
}

export async function rejectItinerary(id) {
  return adminFetch(`/itineraries/${id}/reject`, { method: 'POST' });
}

// Users
export async function getUsers() {
  return adminFetch('/users');
}

export async function updateUserRole(id, role) {
  return adminFetch(`/users/${id}/role`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

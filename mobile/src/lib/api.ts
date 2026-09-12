import { supabase } from './supabase';

const API_BASE_URL = 'http://127.0.0.1:8000'; // FastAPI backend

// Helper to get auth headers
export async function getAuthHeaders(idempotencyKey?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  
  return headers;
}

// 1. Config Options
export async function getArenaConfigOptions() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/config/options`, { headers });
  if (!res.ok) throw new Error('Failed to fetch arena config options');
  return res.json();
}

// 2. Create Arena
export async function createArena(payload: any, idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to create arena');
  }
  return res.json();
}

// 3. Get Arena
export async function getArena(arenaId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/${arenaId}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch arena');
  return res.json();
}

// 4. Start Arena
export async function startArena(arenaId: string, idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/${arenaId}/start`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to start arena');
  }
  return res.json();
}

// 5. Get Arena Rounds
export async function getArenaRounds(arenaId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/${arenaId}/rounds`, { headers });
  if (!res.ok) throw new Error('Failed to fetch rounds');
  return res.json();
}

// Note: startRound() from the plan is omitted because the backend automatically starts 
// the first round when start_arena is called, and subsequent rounds are handled server-side.

// 6. Submit Attempt
export async function submitAttempt(arenaId: string, roundId: string, selectedOption: string, responseMs: number, idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/${arenaId}/rounds/${roundId}/attempts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      selected_option: selectedOption,
      response_ms: responseMs
    }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to submit attempt');
  }
  return res.json();
}

// 7. Friends API
export async function getFriends() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/friends`, { headers });
  if (!res.ok) throw new Error('Failed to fetch friends');
  return res.json();
}

export async function getPendingRequests() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/friends/requests/pending`, { headers });
  if (!res.ok) throw new Error('Failed to fetch pending requests');
  return res.json();
}

export async function sendFriendRequest(friendId: string, idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/friends/requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ friend_id: friendId }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to send friend request');
  }
  return res.json();
}

export async function respondToFriendRequest(requestId: string, accept: boolean, idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/friends/requests/${requestId}/respond`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ accept }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to respond to friend request');
  }
  return res.json();
}

export async function removeFriend(friendId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/friends/${friendId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to remove friend');
  return;
}

// 8. Users API
export async function searchUsers(q: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/users/search?q=${encodeURIComponent(q)}`, { headers });
  if (!res.ok) throw new Error('Failed to search users');
  return res.json();
}

// 9. Invites API
export async function getInvites() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/invites`, { headers });
  if (!res.ok) throw new Error('Failed to fetch invites');
  return res.json();
}

export async function sendInvite(arenaId: string, inviteeId: string, idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/${arenaId}/invites`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ invitee_id: inviteeId }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to send invite');
  }
  return res.json();
}

export async function respondToInvite(inviteId: string, accept: boolean, idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/invites/${inviteId}/respond`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ accept }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to respond to invite');
  }
  return res.json();
}

// 10. Participants API
export async function getParticipants(arenaId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/${arenaId}/participants`, { headers });
  if (!res.ok) throw new Error('Failed to fetch participants');
  return res.json();
}

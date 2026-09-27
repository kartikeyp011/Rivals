import { supabase } from './supabase';

let API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}
if (!API_BASE_URL) {
  console.warn("EXPO_PUBLIC_API_URL is not set!");
}

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

export async function cancelArena(arenaId: string, idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/${arenaId}/cancel`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to cancel arena');
  }
  return res.json();
}

export async function getArenaResults(arenaId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/${arenaId}/results`, { headers });
  if (!res.ok) throw new Error('Failed to fetch arena results');
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

export async function getMyAttempts(arenaId: string, roundId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/${arenaId}/rounds/${roundId}/attempts/me`, { headers });
  if (!res.ok) throw new Error('Failed to fetch my attempts');
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
  const res = await fetch(`${API_BASE_URL}/api/v1/invites?_t=${Date.now()}`, {
    headers: { ...headers, 'Cache-Control': 'no-cache' },
    cache: 'no-store'
  });
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
export async function getArenaInvites(arenaId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/${arenaId}/invites?_t=${Date.now()}`, {
    headers: { ...headers, 'Cache-Control': 'no-cache' },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch arena invites');
  return res.json();
}

export async function getParticipants(arenaId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/${arenaId}/participants`, { headers });
  if (!res.ok) throw new Error('Failed to fetch participants');
  return res.json();
}

// 11. Leaderboards API
export async function getGlobalLeaderboard(period: string = 'daily', periodKey: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/leaderboards/global?period=${period}&period_key=${periodKey}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch global leaderboard');
  return res.json();
}

export async function getFriendsLeaderboard(period: string = 'daily', periodKey: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/leaderboards/friends?period=${period}&period_key=${periodKey}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch friends leaderboard');
  return res.json();
}

export async function getLeaderboardMe(period: string = 'daily', periodKey: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/leaderboards/me?period=${period}&period_key=${periodKey}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch user leaderboard rank');
  return res.json();
}

// 12. Arenas API (List)
export async function getArenas() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas`, { headers });
  if (!res.ok) throw new Error('Failed to fetch arenas');
  return res.json();
}

export async function getDailyArena() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/arenas/daily`, { headers });
  if (!res.ok) throw new Error('Failed to fetch daily arena');
  return res.json();
}

// 13. Coins API
export async function getCoins() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/coins/balance`, { headers });
  if (!res.ok) throw new Error('Failed to fetch coins');
  const data = await res.json();
  return data.balance;
}

export async function getCoinTransactions() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/coins/transactions`, { headers });
  if (!res.ok) throw new Error('Failed to fetch coin transactions');
  return res.json();
}

// 14. Streaks API
export async function getStreak() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/streaks/me`, { headers });
  if (!res.ok) throw new Error('Failed to fetch streak');
  return res.json();
}

export async function recoverStreak(idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/streaks/recover`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to recover streak');
  }
  return res.json();
}

// 15. Wagers API
export async function getWagers() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/wagers`, { headers });
  if (!res.ok) throw new Error('Failed to fetch wagers');
  return res.json();
}

export async function getWager(wagerId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/wagers/${wagerId}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch wager');
  return res.json();
}

export async function createWager(payload: any, idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/wagers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to create wager');
  }
  return res.json();
}

export async function acceptWager(wagerId: string, idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/wagers/${wagerId}/accept`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to accept wager');
  }
  return res.json();
}

export async function declineWager(wagerId: string, idempotencyKey: string) {
  const headers = await getAuthHeaders(idempotencyKey);
  const res = await fetch(`${API_BASE_URL}/api/v1/wagers/${wagerId}/decline`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Failed to decline wager');
  }
  return res.json();
}

// 16. Account API
export async function deleteAccount() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    let errorMsg = 'Failed to delete account';
    try {
      const errorData = await res.json();
      console.error(`[deleteAccount] Server returned HTTP ${res.status}:`, JSON.stringify(errorData));
      errorMsg = errorData.error?.message || errorData.detail || `Server error ${res.status}`;
    } catch (e) {
      console.error(`[deleteAccount] Failed to parse error response as JSON. Status: ${res.status}`);
      errorMsg = `Server error ${res.status}`;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

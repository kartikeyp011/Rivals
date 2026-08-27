import { getAcceptedFriends } from './friendState';
import { spendCoins, addCoins } from './coinState';

export interface WagerParticipant {
  userId: string;
  name: string;
  avatar: string;
  status: 'invited' | 'accepted' | 'declined' | 'completed' | 'forfeited';
  score?: number;
  stakeLocked: boolean;
}

export interface Wager {
  id: string;
  creatorId: string;
  type: '1v1' | 'multi';
  stake: 10 | 25 | 50;
  participants: WagerParticipant[];
  status: 'pending' | 'active' | 'resolving' | 'resolved' | 'expired';
  createdAt: Date;
  resolvedAt?: Date;
  winnerId?: string;
}

let wagers: Wager[] = [];

// Mock current user ID for testing
const CURRENT_USER_ID = '1';
const CURRENT_USER_NAME = 'You';
const CURRENT_USER_AVATAR = '😊';

export const getWagers = () => wagers;

export const getIncomingWagers = () => {
  return wagers.filter(w => 
    w.status === 'pending' && 
    w.participants.some(p => p.userId === CURRENT_USER_ID && p.status === 'invited')
  );
};

export const getActiveWagers = () => {
  return wagers.filter(w => 
    w.status === 'active' && 
    w.participants.some(p => p.userId === CURRENT_USER_ID)
  );
};

export const getCompletedWagers = () => {
  return wagers.filter(w => 
    (w.status === 'resolved' || w.status === 'expired') &&
    w.participants.some(p => p.userId === CURRENT_USER_ID)
  );
};

export const createWager = (
  type: '1v1' | 'multi',
  stake: 10 | 25 | 50,
  friendIds: string[]
): Wager | null => {
  const friends = getAcceptedFriends();
  const selectedFriends = friends.filter(f => friendIds.includes(f.id));
  
  if (selectedFriends.length === 0) return null;
  if (type === '1v1' && selectedFriends.length !== 1) return null;
  if (type === 'multi' && selectedFriends.length < 2) return null;
  
  // Check if user has enough coins
  // We'll skip this check for now since we're using mock data
  
  const participants: WagerParticipant[] = [
    {
      userId: CURRENT_USER_ID,
      name: CURRENT_USER_NAME,
      avatar: CURRENT_USER_AVATAR,
      status: 'accepted',
      stakeLocked: true,
    },
    ...selectedFriends.map(f => ({
      userId: f.id,
      name: f.name,
      avatar: f.avatar,
      status: 'invited' as const,
      stakeLocked: false,
    }))
  ];
  
  // Lock creator's stake
  spendCoins(stake, `Wager stake (${type})`, 'wager');
  
  const wager: Wager = {
    id: `wager_${Date.now()}`,
    creatorId: CURRENT_USER_ID,
    type,
    stake,
    participants,
    status: 'pending',
    createdAt: new Date(),
  };
  
  wagers.unshift(wager);
  return wager;
};

export const acceptWager = (wagerId: string): boolean => {
  const wager = wagers.find(w => w.id === wagerId);
  if (!wager || wager.status !== 'pending') return false;
  
  const participant = wager.participants.find(p => p.userId === CURRENT_USER_ID);
  if (!participant || participant.status !== 'invited') return false;
  
  // Lock stake
  spendCoins(wager.stake, `Wager acceptance (${wager.type})`, 'wager');
  
  participant.status = 'accepted';
  participant.stakeLocked = true;
  
  // Check if all participants have accepted
  const allAccepted = wager.participants.every(p => p.status === 'accepted');
  if (allAccepted) {
    wager.status = 'active';
  }
  
  return true;
};

export const declineWager = (wagerId: string): boolean => {
  const wager = wagers.find(w => w.id === wagerId);
  if (!wager || wager.status !== 'pending') return false;
  
  const participant = wager.participants.find(p => p.userId === CURRENT_USER_ID);
  if (!participant || participant.status !== 'invited') return false;
  
  participant.status = 'declined';
  return true;
};

export const resolveWager = (wagerId: string, scores: Record<string, number>): boolean => {
  const wager = wagers.find(w => w.id === wagerId);
  if (!wager || wager.status !== 'active') return false;
  
  // Update scores
  wager.participants.forEach(p => {
    if (scores[p.userId] !== undefined) {
      p.score = scores[p.userId];
      p.status = 'completed';
    }
  });
  
  // Determine winner
  const completed = wager.participants.filter(p => p.status === 'completed');
  if (completed.length < 2) {
    // Not enough participants completed
    wager.status = 'expired';
    // Refund all participants
    wager.participants.forEach(p => {
      if (p.stakeLocked) {
        addCoins(wager.stake, `Wager refund (expired)`, 'refund');
        p.stakeLocked = false;
      }
    });
    return true;
  }
  
  // Sort by score (highest first)
  const sorted = [...completed].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  if (wager.type === '1v1') {
    // Winner takes all
    const winner = sorted[0];
    const pool = wager.stake * 2;
    addCoins(winner.userId === CURRENT_USER_ID ? pool : 0, 'Wager won!', 'payout');
    wager.winnerId = winner.userId;
  } else {
    // Multi: 1st gets remaining pool, 2nd gets stake back
    const first = sorted[0];
    const second = sorted[1];
    const pool = wager.stake * sorted.length;
    
    // Return stake to 2nd place
    if (second.userId === CURRENT_USER_ID) {
      addCoins(wager.stake, '2nd place - stake returned', 'refund');
    }
    
    // Remaining pool to 1st place
    const remaining = pool - wager.stake;
    if (first.userId === CURRENT_USER_ID) {
      addCoins(remaining, '1st place - wager won!', 'payout');
    }
    wager.winnerId = first.userId;
  }
  
  wager.status = 'resolved';
  wager.resolvedAt = new Date();
  return true;
};

// Mock resolve - for testing
export const mockResolveWager = (wagerId: string) => {
  const wager = wagers.find(w => w.id === wagerId);
  if (!wager) return;
  
  const scores: Record<string, number> = {};
  wager.participants.forEach(p => {
    // Random scores between 50-400
    scores[p.userId] = Math.floor(Math.random() * 350) + 50;
  });
  
  resolveWager(wagerId, scores);
};

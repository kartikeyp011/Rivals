export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  freeRecoveryAvailable: boolean;
}

let streakState: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  freeRecoveryAvailable: true,
};

export const getStreakState = () => streakState;

export const updateStreak = () => {
  const today = new Date().toDateString();
  const lastDate = streakState.lastCompletedDate ? new Date(streakState.lastCompletedDate) : null;
  
  // If already completed today, don't update
  if (lastDate && lastDate.toDateString() === today) {
    return;
  }
  
  // Check if consecutive
  if (lastDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastDate.toDateString() === yesterday.toDateString();
    
    if (isConsecutive) {
      streakState.currentStreak += 1;
    } else {
      // Broken streak
      streakState.currentStreak = 1;
    }
  } else {
    // First completion
    streakState.currentStreak = 1;
  }
  
  // Update longest streak
  if (streakState.currentStreak > streakState.longestStreak) {
    streakState.longestStreak = streakState.currentStreak;
  }
  
  streakState.lastCompletedDate = today;
};

export const getRecoveryAvailable = () => {
  return streakState.freeRecoveryAvailable;
};

export const useRecovery = () => {
  if (!streakState.freeRecoveryAvailable) {
    return false;
  }
  
  // Restore streak
  streakState.currentStreak += 1;
  streakState.freeRecoveryAvailable = false;
  const today = new Date().toDateString();
  streakState.lastCompletedDate = today;
  
  return true;
};

export const resetStreakState = () => {
  streakState = {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    freeRecoveryAvailable: true,
  };
};

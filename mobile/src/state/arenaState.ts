export type RoundStatus = 'pending' | 'active' | 'completed';

export interface RoundScore {
  status: RoundStatus;
  points: number;
  isCorrect: boolean;
}

export interface ArenaState {
  arenaId: string | null;
  attemptId: string | null;
  word: RoundScore;
  cipher: RoundScore;
  number: RoundScore;
}

// Simple global state for arena progress
let arenaState: ArenaState = {
  arenaId: null,
  attemptId: null,
  word: { status: 'active', points: 0, isCorrect: false },
  cipher: { status: 'pending', points: 0, isCorrect: false },
  number: { status: 'pending', points: 0, isCorrect: false },
};

export const getArenaState = () => arenaState;

export const setArenaIds = (arenaId: string, attemptId: string) => {
  arenaState.arenaId = arenaId;
  arenaState.attemptId = attemptId;
};

export const setRoundCompleted = (
  round: 'word' | 'cipher' | 'number',
  points: number,
  isCorrect: boolean
) => {
  arenaState[round].status = 'completed';
  arenaState[round].points = points;
  arenaState[round].isCorrect = isCorrect;
  
  // Auto-activate next round
  if (round === 'word') {
    arenaState.cipher.status = 'active';
  } else if (round === 'cipher') {
    arenaState.number.status = 'active';
  }
};

export const resetArenaState = () => {
  arenaState = {
    arenaId: null,
    attemptId: null,
    word: { status: 'active', points: 0, isCorrect: false },
    cipher: { status: 'pending', points: 0, isCorrect: false },
    number: { status: 'pending', points: 0, isCorrect: false },
  };
};

export const getTotalScore = () => {
  return arenaState.word.points + arenaState.cipher.points + arenaState.number.points;
};

export const getCorrectCount = () => {
  let count = 0;
  if (arenaState.word.isCorrect) count++;
  if (arenaState.cipher.isCorrect) count++;
  if (arenaState.number.isCorrect) count++;
  return count;
};

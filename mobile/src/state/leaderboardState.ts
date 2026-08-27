export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  isFriend: boolean;
  isUser: boolean;
}

export interface LeaderboardData {
  daily: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
}

// Mock data for testing
const mockUsers = [
  { id: '1', name: 'You', avatar: '😊', isUser: true, isFriend: false },
  { id: '2', name: 'Alex', avatar: '😎', isUser: false, isFriend: true },
  { id: '3', name: 'Sarah', avatar: '🤩', isUser: false, isFriend: true },
  { id: '4', name: 'Mike', avatar: '🧠', isUser: false, isFriend: true },
  { id: '5', name: 'Emma', avatar: '💪', isUser: false, isFriend: false },
  { id: '6', name: 'James', avatar: '🦊', isUser: false, isFriend: false },
  { id: '7', name: 'Lisa', avatar: '🐉', isUser: false, isFriend: false },
  { id: '8', name: 'Tom', avatar: '🚀', isUser: false, isFriend: false },
  { id: '9', name: 'Anna', avatar: '🎯', isUser: false, isFriend: false },
  { id: '10', name: 'John', avatar: '🏆', isUser: false, isFriend: false },
];

// Generate random scores
const generateScores = () => {
  return mockUsers.map(user => ({
    ...user,
    score: Math.floor(Math.random() * 400) + 50, // 50-450
  }));
};

// Sort by score descending and assign ranks
const rankScores = (entries: any[]) => {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

// Generate Daily leaderboard
const generateDaily = () => {
  const entries = generateScores();
  // Make sure "You" is in the list with a reasonable score
  const you = entries.find(e => e.isUser);
  if (you) {
    you.score = 320; // Fixed score for consistency
  }
  return rankScores(entries);
};

// Generate All-Time leaderboard (different scores)
const generateAllTime = () => {
  const entries = generateScores();
  const you = entries.find(e => e.isUser);
  if (you) {
    you.score = 2800; // Higher all-time score
  }
  return rankScores(entries);
};

// State
let leaderboardData: LeaderboardData = {
  daily: generateDaily(),
  allTime: generateAllTime(),
};

export const getLeaderboardData = () => leaderboardData;

export const getFriendsLeaderboard = (type: 'daily' | 'allTime') => {
  const data = leaderboardData[type];
  return data.filter(entry => entry.isFriend || entry.isUser);
};

export const getGlobalLeaderboard = (type: 'daily' | 'allTime') => {
  return leaderboardData[type];
};

export const getUserRank = (type: 'daily' | 'allTime') => {
  const data = leaderboardData[type];
  return data.find(entry => entry.isUser);
};

export const refreshLeaderboards = () => {
  leaderboardData = {
    daily: generateDaily(),
    allTime: generateAllTime(),
  };
};

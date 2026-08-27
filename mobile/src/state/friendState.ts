export interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'pending' | 'accepted';
}

export interface FriendRequest {
  id: string;
  from: string;
  fromName: string;
  fromAvatar: string;
  status: 'pending' | 'accepted' | 'rejected';
}

let friends: Friend[] = [
  { id: '2', name: 'Alex', avatar: '😎', status: 'accepted' },
  { id: '3', name: 'Sarah', avatar: '🤩', status: 'accepted' },
  { id: '4', name: 'Mike', avatar: '🧠', status: 'accepted' },
];

let friendRequests: FriendRequest[] = [
  { id: '5', from: '5', fromName: 'Emma', fromAvatar: '💪', status: 'pending' },
  { id: '6', from: '6', fromName: 'James', fromAvatar: '🦊', status: 'pending' },
];

// Available users to add (mock)
const availableUsers = [
  { id: '7', name: 'Lisa', avatar: '🐉' },
  { id: '8', name: 'Tom', avatar: '🚀' },
  { id: '9', name: 'Anna', avatar: '🎯' },
  { id: '10', name: 'John', avatar: '🏆' },
  { id: '11', name: 'Mia', avatar: '🌟' },
  { id: '12', name: 'Noah', avatar: '🦁' },
  { id: '13', name: 'Olivia', avatar: '🌸' },
  { id: '14', name: 'Liam', avatar: '⚡' },
];

export const getFriends = () => friends;

export const getFriendRequests = () => friendRequests;

export const getPendingRequests = () => friendRequests.filter(r => r.status === 'pending');

export const getAcceptedFriends = () => friends.filter(f => f.status === 'accepted');

export const getAvailableUsers = () => {
  const friendIds = new Set(friends.map(f => f.id));
  const requestIds = new Set(friendRequests.map(r => r.from));
  return availableUsers.filter(u => !friendIds.has(u.id) && !requestIds.has(u.id));
};

export const sendFriendRequest = (userId: string) => {
  const user = availableUsers.find(u => u.id === userId);
  if (!user) return false;
  
  // Check if already requested
  if (friendRequests.some(r => r.from === userId && r.status === 'pending')) {
    return false;
  }
  
  friendRequests.push({
    id: `req_${Date.now()}`,
    from: user.id,
    fromName: user.name,
    fromAvatar: user.avatar,
    status: 'pending',
  });
  return true;
};

export const acceptFriendRequest = (requestId: string) => {
  const request = friendRequests.find(r => r.id === requestId);
  if (!request || request.status !== 'pending') return false;
  
  request.status = 'accepted';
  friends.push({
    id: request.from,
    name: request.fromName,
    avatar: request.fromAvatar,
    status: 'accepted',
  });
  return true;
};

export const rejectFriendRequest = (requestId: string) => {
  const request = friendRequests.find(r => r.id === requestId);
  if (!request || request.status !== 'pending') return false;
  
  request.status = 'rejected';
  return true;
};

export const removeFriend = (friendId: string) => {
  const index = friends.findIndex(f => f.id === friendId);
  if (index === -1) return false;
  friends.splice(index, 1);
  return true;
};

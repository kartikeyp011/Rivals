import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import * as api from '@/lib/api';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type TabType = 'friends' | 'requests' | 'add';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'friends') {
        const data = await api.getFriends();
        setFriends(data);
      } else if (activeTab === 'requests') {
        const data = await api.getPendingRequests();
        setRequests(data);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length >= 2) {
      try {
        const users = await api.searchUsers(text);
        setAvailableUsers(users);
      } catch (e) {
        // ignore search errors or handle silently
      }
    } else {
      setAvailableUsers([]);
    }
  };

  const handleSendRequest = async (userId: string, userName: string) => {
    try {
      await api.sendFriendRequest(userId, uuidv4());
      Alert.alert('✅ Request Sent', `Friend request sent to ${userName}!`);
      // Optionally reload data or remove user from search list
    } catch (e: any) {
      Alert.alert('⚠️', e.message || 'Failed to send request.');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.respondToFriendRequest(requestId, true, uuidv4());
      Alert.alert('🎉', 'Friend request accepted!');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.respondToFriendRequest(requestId, false, uuidv4());
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to reject request');
    }
  };

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeFriend(friendId);
              loadData();
              Alert.alert('✅', `Removed ${friendName} from friends.`);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>👥 Friends</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'add' && styles.activeTab]}
          onPress={() => setActiveTab('add')}
        >
          <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>
            Add +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && activeTab !== 'add' ? (
          <ActivityIndicator size="large" color="#6c5ce7" style={{ marginTop: 50 }} />
        ) : (
          <>
            {activeTab === 'friends' && (
              <>
                {friends.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>👥</Text>
                    <Text style={styles.emptyText}>No friends yet</Text>
                    <Text style={styles.emptySubtext}>Add friends to compete on leaderboards!</Text>
                  </View>
                ) : (
                  friends.map((friend) => (
                    <View key={friend.friend_id} style={styles.friendItem}>
                      <Text style={styles.friendAvatar}>{friend.friend_avatar_url || '👤'}</Text>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{friend.friend_username}</Text>
                        <Text style={styles.friendStatus}>Friend</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveFriend(friend.friend_id, friend.friend_username)}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </>
            )}

            {activeTab === 'requests' && (
              <>
                {requests.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>📭</Text>
                    <Text style={styles.emptyText}>No pending requests</Text>
                    <Text style={styles.emptySubtext}>When friends add you, they'll appear here.</Text>
                  </View>
                ) : (
                  requests.map((request) => (
                    <View key={request.id} style={styles.requestItem}>
                      <Text style={styles.requestAvatar}>{request.friend_avatar_url || '👤'}</Text>
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestName}>{request.friend_username}</Text>
                        <Text style={styles.requestStatus}>Pending</Text>
                      </View>
                      <View style={styles.requestActions}>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => handleAcceptRequest(request.id)}
                        >
                          <Text style={styles.acceptButtonText}>✓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => handleRejectRequest(request.id)}
                        >
                          <Text style={styles.rejectButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {activeTab === 'add' && (
              <>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    placeholderTextColor="#555"
                    value={searchQuery}
                    onChangeText={handleSearch}
                  />
                </View>
                
                {availableUsers.length === 0 && searchQuery.length >= 2 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🔍</Text>
                    <Text style={styles.emptyText}>No users found</Text>
                    <Text style={styles.emptySubtext}>Try a different search.</Text>
                  </View>
                ) : (
                  availableUsers.map((user) => (
                    <View key={user.id} style={styles.addItem}>
                      <Text style={styles.addAvatar}>{user.avatar_url || '👤'}</Text>
                      <View style={styles.addInfo}>
                        <Text style={styles.addName}>{user.username}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleSendRequest(user.id, user.username)}
                      >
                        <Text style={styles.addButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6c5ce7',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  friendAvatar: {
    fontSize: 28,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  friendStatus: {
    color: '#00b894',
    fontSize: 12,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: '#ff6b6b',
    fontSize: 18,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  requestAvatar: {
    fontSize: 28,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  requestStatus: {
    color: '#fdcb6e',
    fontSize: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#00b894',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#ff6b6b',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  addAvatar: {
    fontSize: 28,
    marginRight: 12,
  },
  addInfo: {
    flex: 1,
  },
  addName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 14,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
});
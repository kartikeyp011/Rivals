import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Image } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as api from '@/lib/api';

export interface LeaderboardEntry {
  id: string | null;   // leaderboard row UUID — null when the user has no scored row yet
  user_id: string;     // profile/auth UUID — always present
  name: string;
  avatar: string;
  score: number;
  rank: number;
  isFriend: boolean;
  isUser: boolean;
}

type LeaderboardType = 'friends' | 'global';
type TimeType = 'daily' | 'allTime';

export default function LeaderboardsScreen() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('friends');
  const [timeType, setTimeType] = useState<TimeType>('daily');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { tab } = useLocalSearchParams<{ tab: string }>();

  useEffect(() => {
    if (tab === 'friends' || tab === 'global') {
      setActiveTab(tab as LeaderboardType);
    }
  }, [tab]);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log(`[leaderboards.tsx] No session, skipping fetch.`);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      let rawData;
      
      const now = new Date();
      const periodKey = timeType === 'daily' ? now.toISOString().split('T')[0] : 'all_time';
      const backendPeriod = timeType === 'daily' ? 'daily' : 'all_time';

      if (activeTab === 'friends') {
        rawData = await api.getFriendsLeaderboard(backendPeriod, periodKey);
      } else {
        rawData = await api.getGlobalLeaderboard(backendPeriod, periodKey);
      }

      const mappedData: LeaderboardEntry[] = rawData.map((item: any, index: number) => ({
        id: item.id ?? null,          // leaderboard row id — may be null for zero-score users
        user_id: item.user_id,        // profile UUID — always non-null
        name: item.username || 'Unknown',
        avatar: item.avatar_url || '👤',
        score: item.score,
        rank: item.rank || index + 1,
        isFriend: activeTab === 'friends' && item.user_id !== currentUserId,
        isUser: item.user_id === currentUserId
      }));

      setEntries(mappedData);
      
      const userRankEntry = mappedData.find(e => e.isUser);
      setUserRank(userRankEntry || null);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to load leaderboards');
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeTab, timeType])
  );

  const onRefresh = () => {
    loadData();
  };

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboards</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            👥 Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'global' && styles.activeTab]}
          onPress={() => setActiveTab('global')}
        >
          <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>
            🌍 Global
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time Selector */}
      <View style={styles.timeContainer}>
        <TouchableOpacity
          style={[styles.timeTab, timeType === 'daily' && styles.activeTimeTab]}
          onPress={() => setTimeType('daily')}
        >
          <Text style={[styles.timeText, timeType === 'daily' && styles.activeTimeText]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeTab, timeType === 'allTime' && styles.activeTimeTab]}
          onPress={() => setTimeType('allTime')}
        >
          <Text style={[styles.timeText, timeType === 'allTime' && styles.activeTimeText]}>
            All-Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* User Rank Card */}
      {userRank && (
        <View style={styles.userRankCard}>
          {userRank.avatar.startsWith('http') ? (
            <Image source={{ uri: userRank.avatar }} style={styles.avatarImageLarge} />
          ) : (
            <Text style={styles.userRankEmoji}>{userRank.avatar}</Text>
          )}
          <View style={styles.userRankInfo}>
            <Text style={styles.userRankName}>{userRank.name} (You)</Text>
            <Text style={styles.userRankScore}>Score: {userRank.score}</Text>
          </View>
          <View style={styles.userRankBadge}>
            <Text style={styles.userRankBadgeText}>#{userRank.rank}</Text>
          </View>
        </View>
      )}

      {/* Leaderboard List */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />
        }
      >
        {!refreshing && entries.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>
              {activeTab === 'friends' ? '👥' : '🌍'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              No Scores Yet
            </Text>
            <Text style={{ color: '#888', marginTop: 8 }}>
              {activeTab === 'friends' ? "None of your friends have played yet." : "No one has played yet."}
            </Text>
          </View>
        ) : (
          entries.map((entry, index) => (
            <View key={entry.user_id} style={[
              styles.entry,
              entry.isUser && styles.userEntry,
              index === 0 && styles.firstEntry,
            ]}>
              <View style={styles.entryLeft}>
                <Text style={styles.entryRank}>{getMedal(entry.rank)}</Text>
                {entry.avatar.startsWith('http') ? (
                  <Image source={{ uri: entry.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.entryAvatar}>{entry.avatar}</Text>
                )}
                <View style={styles.entryInfo}>
                  <Text style={[
                    styles.entryName,
                    entry.isUser && styles.userName
                  ]}>
                    {entry.name}{entry.isUser ? ' (You)' : ''}
                    {entry.isFriend && !entry.isUser && ' ⭐'}
                  </Text>
                  {entry.isFriend && !entry.isUser && (
                    <Text style={styles.friendBadge}>Friend</Text>
                  )}
                </View>
              </View>
              <Text style={styles.entryScore}>{entry.score}</Text>
            </View>
          ))
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
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  timeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  timeTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a3a',
  },
  activeTimeTab: {
    backgroundColor: '#6c5ce7',
  },
  timeText: {
    color: '#666',
    fontSize: 13,
  },
  activeTimeText: {
    color: '#ffffff',
  },
  userRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a3a',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6c5ce7',
    marginBottom: 16,
  },
  userRankEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  userRankInfo: {
    flex: 1,
  },
  userRankName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userRankScore: {
    color: '#8888aa',
    fontSize: 14,
  },
  userRankBadge: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userRankBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a3a',
  },
  firstEntry: {
    borderTopWidth: 1,
    borderTopColor: '#1a1a3a',
  },
  userEntry: {
    backgroundColor: '#1a1a3a',
    borderRadius: 8,
    marginVertical: 2,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryRank: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    width: 40,
  },
  entryAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 12,
  },
  avatarImageLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  userName: {
    color: '#6c5ce7',
    fontWeight: 'bold',
  },
  friendBadge: {
    color: '#fdcb6e',
    fontSize: 10,
    marginTop: 1,
  },
  entryScore: {
    color: '#fdcb6e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
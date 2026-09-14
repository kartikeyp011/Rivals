import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import { useFocusEffect } from 'expo-router';

type TabType = 'incoming' | 'active' | 'completed';

export default function WagersScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [wagers, setWagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeTab])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getWagers();
      
      // Need current user ID to determine incoming vs active
      // In a real app we'd get this from a context. For now, fetch session.
      const { supabase } = require('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      setCurrentUserId(uid);

      let filtered = [];
      if (activeTab === 'incoming') {
        filtered = data.filter((w: any) => 
          w.status === 'open' && 
          w.created_by !== uid && 
          !w.participants.some((p: any) => p.user_id === uid)
        );
      } else if (activeTab === 'active') {
        filtered = data.filter((w: any) => 
          w.status === 'locked' || 
          (w.status === 'open' && (w.created_by === uid || w.participants.some((p: any) => p.user_id === uid)))
        );
      } else {
        filtered = data.filter((w: any) => w.status === 'settled' || w.status === 'voided');
      }

      setWagers(filtered);
    } catch (e) {
      console.error('Failed to load wagers', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return '⏳ Pending';
      case 'locked': return '⚔️ Active';
      case 'settled': return '✅ Resolved';
      case 'voided': return '⏰ Voided';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#fdcb6e';
      case 'locked': return '#6c5ce7';
      case 'settled': return '#00b894';
      case 'voided': return '#ff6b6b';
      default: return '#666';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ Wagers</Text>
        <TouchableOpacity onPress={() => router.push('/wagers/create' as any)} style={styles.createButton}>
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incoming' && styles.activeTab]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>
            📩 Incoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            ⚔️ Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            📊 Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#6c5ce7" style={{ marginTop: 40 }} />
        ) : wagers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>
              {activeTab === 'incoming' && '📭'}
              {activeTab === 'active' && '⚔️'}
              {activeTab === 'completed' && '📊'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'incoming' && 'No incoming wagers'}
              {activeTab === 'active' && 'No active wagers'}
              {activeTab === 'completed' && 'No completed wagers'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'incoming' && 'Challenge friends to compete!'}
              {activeTab === 'active' && 'Join or create wagers to compete'}
              {activeTab === 'completed' && 'Complete wagers will appear here'}
            </Text>
            {activeTab === 'incoming' && (
              <TouchableOpacity 
                style={styles.createWagerButton}
                onPress={() => router.push('/wagers/create' as any)}
              >
                <Text style={styles.createWagerButtonText}>Create Wager →</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          wagers.map((wager) => (
            <TouchableOpacity
              key={wager.id}
              style={styles.wagerItem}
              onPress={() => router.push(`/wagers/details?id=${wager.id}` as any)}
            >
              <View style={styles.wagerHeader}>
                <Text style={styles.wagerType}>
                  🪙 Pot: {wager.total_pot}
                </Text>
                <Text style={[styles.wagerStatus, { color: getStatusColor(wager.status) }]}>
                  {getStatusText(wager.status)}
                </Text>
              </View>
              <View style={styles.wagerBody}>
                <Text style={styles.wagerStake}>🪙 {wager.coin_amount} coins</Text>
                <Text style={styles.wagerParticipants}>
                  {wager.participants.length} joined
                </Text>
              </View>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#ffffff',
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#6c5ce7',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
  createWagerButton: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  createWagerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wagerItem: {
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  wagerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wagerType: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  wagerStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  wagerBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wagerStake: {
    color: '#fdcb6e',
    fontSize: 14,
  },
  wagerParticipants: {
    color: '#8888aa',
    fontSize: 14,
  },
});

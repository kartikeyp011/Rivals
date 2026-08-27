import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { getWagers, getIncomingWagers, getActiveWagers, getCompletedWagers, Wager } from '@/state/wagerState';

type TabType = 'incoming' | 'active' | 'completed';

export default function WagersScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [wagers, setWagers] = useState<Wager[]>([]);

  const loadData = () => {
    if (activeTab === 'incoming') {
      setWagers(getIncomingWagers());
    } else if (activeTab === 'active') {
      setWagers(getActiveWagers());
    } else {
      setWagers(getCompletedWagers());
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ Pending';
      case 'active': return '⚔️ Active';
      case 'resolved': return '✅ Resolved';
      case 'expired': return '⏰ Expired';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#fdcb6e';
      case 'active': return '#6c5ce7';
      case 'resolved': return '#00b894';
      case 'expired': return '#ff6b6b';
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
        {wagers.length === 0 ? (
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
                  {wager.type === '1v1' ? '⚔️ 1v1' : '👥 Multi'}
                </Text>
                <Text style={[styles.wagerStatus, { color: getStatusColor(wager.status) }]}>
                  {getStatusText(wager.status)}
                </Text>
              </View>
              <View style={styles.wagerBody}>
                <Text style={styles.wagerStake}>🪙 {wager.stake} coins</Text>
                <Text style={styles.wagerParticipants}>
                  {wager.participants.length} participants
                </Text>
              </View>
              <View style={styles.wagerParticipantsList}>
                {wager.participants.map((p, idx) => (
                  <Text key={idx} style={styles.participantName}>
                    {p.avatar} {p.name}
                    {p.status === 'accepted' && ' ✅'}
                    {p.status === 'invited' && ' ⏳'}
                  </Text>
                ))}
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
  wagerParticipantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  participantName: {
    color: '#8888aa',
    fontSize: 12,
    marginRight: 8,
  },
});

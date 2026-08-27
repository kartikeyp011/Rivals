import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getWagers, acceptWager, declineWager, mockResolveWager, Wager } from '@/state/wagerState';

export default function WagerDetailsScreen() {
  const params = useLocalSearchParams();
  const wagerId = params.id as string;
  const [wager, setWager] = useState<Wager | null>(null);

  useEffect(() => {
    const found = getWagers().find(w => w.id === wagerId);
    setWager(found || null);
  }, [wagerId]);

  const handleAccept = () => {
    if (!wager) return;
    const success = acceptWager(wager.id);
    if (success) {
      Alert.alert('✅', 'Wager accepted! Your stake is locked.');
      const updated = getWagers().find(w => w.id === wagerId);
      setWager(updated || null);
    } else {
      Alert.alert('❌', 'Failed to accept wager.');
    }
  };

  const handleDecline = () => {
    if (!wager) return;
    const success = declineWager(wager.id);
    if (success) {
      Alert.alert('✅', 'Wager declined.');
      router.back();
    } else {
      Alert.alert('❌', 'Failed to decline wager.');
    }
  };

  const handleResolve = () => {
    if (!wager) return;
    mockResolveWager(wager.id);
    const updated = getWagers().find(w => w.id === wagerId);
    setWager(updated || null);
    Alert.alert('✅', 'Wager resolved! Check results.');
  };

  if (!wager) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Wager Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Wager not found</Text>
        </View>
      </View>
    );
  }

  const isCreator = wager.creatorId === '1';
  const isInvited = wager.participants.some(p => p.userId === '1' && p.status === 'invited');
  const isAccepted = wager.participants.some(p => p.userId === '1' && p.status === 'accepted');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Wager Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.wagerType}>
            {wager.type === '1v1' ? '⚔️ 1v1 Wager' : '👥 Multi-Friend Wager'}
          </Text>
          <Text style={[styles.wagerStatus, 
            wager.status === 'pending' && styles.statusPending,
            wager.status === 'active' && styles.statusActive,
            wager.status === 'resolved' && styles.statusResolved,
          ]}>
            {wager.status.toUpperCase()}
          </Text>
          <Text style={styles.wagerStake}>🪙 {wager.stake} coins per player</Text>
          <Text style={styles.wagerPool}>
            Total Pool: 🪙 {wager.stake * wager.participants.length}
          </Text>
        </View>

        {/* Participants */}
        <Text style={styles.sectionTitle}>Participants</Text>
        {wager.participants.map((p, idx) => (
          <View key={idx} style={styles.participantItem}>
            <Text style={styles.participantAvatar}>{p.avatar}</Text>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                {p.name} {p.userId === '1' && '(You)'}
              </Text>
              <Text style={[
                styles.participantStatus,
                p.status === 'accepted' && styles.statusAccepted,
                p.status === 'invited' && styles.statusInvited,
                p.status === 'completed' && styles.statusCompleted,
                p.status === 'declined' && styles.statusDeclined,
              ]}>
                {p.status === 'accepted' && '✅ Accepted'}
                {p.status === 'invited' && '⏳ Invited'}
                {p.status === 'completed' && '✓ Completed'}
                {p.status === 'declined' && '❌ Declined'}
              </Text>
            </View>
            {p.score !== undefined && (
              <Text style={styles.participantScore}>{p.score} pts</Text>
            )}
          </View>
        ))}

        {/* Actions */}
        {wager.status === 'pending' && isInvited && (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <Text style={styles.acceptButtonText}>✅ Accept Wager</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
              <Text style={styles.declineButtonText}>✕ Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {wager.status === 'pending' && isCreator && !isInvited && (
          <View style={styles.actionContainer}>
            <Text style={styles.waitingText}>⏳ Waiting for others to accept...</Text>
          </View>
        )}

        {wager.status === 'active' && isCreator && (
          <TouchableOpacity style={styles.resolveButton} onPress={handleResolve}>
            <Text style={styles.resolveButtonText}>⚔️ Resolve Wager (Test)</Text>
          </TouchableOpacity>
        )}

        {wager.status === 'resolved' && wager.winnerId && (
          <View style={styles.winnerCard}>
            <Text style={styles.winnerEmoji}>🏆</Text>
            <Text style={styles.winnerText}>
              Winner: {wager.participants.find(p => p.userId === wager.winnerId)?.name}
            </Text>
          </View>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  statusCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a5a',
    marginBottom: 20,
    alignItems: 'center',
  },
  wagerType: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wagerStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusPending: {
    color: '#fdcb6e',
  },
  statusActive: {
    color: '#6c5ce7',
  },
  statusResolved: {
    color: '#00b894',
  },
  wagerStake: {
    color: '#fdcb6e',
    fontSize: 16,
  },
  wagerPool: {
    color: '#8888aa',
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  participantAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  participantStatus: {
    fontSize: 12,
  },
  statusAccepted: {
    color: '#00b894',
  },
  statusInvited: {
    color: '#fdcb6e',
  },
  statusCompleted: {
    color: '#6c5ce7',
  },
  statusDeclined: {
    color: '#ff6b6b',
  },
  participantScore: {
    color: '#fdcb6e',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionContainer: {
    gap: 8,
    marginTop: 16,
  },
  acceptButton: {
    backgroundColor: '#00b894',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  waitingText: {
    color: '#fdcb6e',
    fontSize: 16,
    textAlign: 'center',
    padding: 16,
  },
  resolveButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  resolveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  winnerCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fdcb6e',
    alignItems: 'center',
    marginTop: 16,
  },
  winnerEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  winnerText: {
    color: '#fdcb6e',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

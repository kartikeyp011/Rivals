import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as api from '@/lib/api';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from 'react';
import { getWager, acceptWager, declineWager } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function WagerDetailsScreen() {
  const params = useLocalSearchParams();
  const wagerId = params.id as string;
  const [wager, setWager] = useState<any | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadWager();
    }, [wagerId])
  );

  const loadWager = async () => {
    try {
      const data = await getWager(wagerId);
      setWager(data);
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAccept = async () => {
    try {
      const idempotencyKey = uuidv4();
      await acceptWager(wagerId, idempotencyKey);
      Alert.alert('✅', 'Wager accepted! Your stake is locked.');
      loadWager();
    } catch (err: any) {
      Alert.alert('❌', err.message || 'Failed to accept wager.');
    }
  };

  const handleDecline = async () => {
    try {
      const idempotencyKey = uuidv4();
      await declineWager(wagerId, idempotencyKey);
      Alert.alert('✅', 'Wager declined.');
      router.back();
    } catch (err: any) {
      Alert.alert('❌', err.message || 'Failed to decline wager.');
    }
  };

  const handleResolve = () => {
    // Wagers are resolved automatically by the backend when the Arena completes
    Alert.alert('ℹ️', 'Wagers resolve automatically when all players complete the Arena.');
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

  const isCreator = wager.created_by === currentUserId;
  // If the wager is open and the user is NOT in the participants list, they are pending an invite
  const isInvited = wager.status === 'open' && !wager.participants.some((p: any) => p.user_id === currentUserId) && !isCreator;
  const isAccepted = wager.participants.some((p: any) => p.user_id === currentUserId);

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
            Arena Wager
          </Text>
          <Text style={[styles.wagerStatus, 
            wager.status === 'open' && styles.statusPending,
            wager.status === 'locked' && styles.statusActive,
            wager.status === 'settled' && styles.statusResolved,
          ]}>
            {wager.status.toUpperCase()}
          </Text>
          <Text style={styles.wagerStake}>🪙 {wager.coin_amount} coins per player</Text>
          <Text style={styles.wagerPool}>
            Total Pot: 🪙 {wager.total_pot}
          </Text>
        </View>

        {/* Participants */}
        <Text style={styles.sectionTitle}>Participants</Text>
        {wager.participants.map((p: any, idx: number) => (
          <View key={idx} style={styles.participantItem}>
            <Text style={styles.participantAvatar}>👤</Text>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                Player {p.user_id.substring(0, 8)} {p.user_id === currentUserId && '(You)'}
              </Text>
              <Text style={[styles.participantStatus, styles.statusAccepted]}>
                ✅ Accepted
              </Text>
            </View>
            {p.coins_won !== null && p.coins_won !== undefined && (
              <Text style={styles.participantScore}>Won: {p.coins_won} 🪙</Text>
            )}
          </View>
        ))}

        {/* Actions */}
        {wager.status === 'open' && isInvited && (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <Text style={styles.acceptButtonText}>✅ Accept Wager</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
              <Text style={styles.declineButtonText}>✕ Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {wager.status === 'open' && isCreator && !isInvited && (
          <View style={styles.actionContainer}>
            <Text style={styles.waitingText}>⏳ Waiting for others to accept...</Text>
          </View>
        )}

        {wager.status === 'locked' && (
          <TouchableOpacity style={styles.resolveButton} onPress={() => router.push(`/arena/${wager.arena_id}` as any)}>
            <Text style={styles.resolveButtonText}>⚔️ Go to Arena</Text>
          </TouchableOpacity>
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

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Alert, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getArena, getArenaRounds, startArena, getParticipants, getFriends, sendInvite, getArenaInvites, getMyAttempts } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Determine if an arena is a Daily Arena (independent single-player mode)
function isDailyArena(arena: any): boolean {
  return arena?.category === 'daily' || arena?.metadata?.type === 'daily';
}

export default function ArenaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [arena, setArena] = useState<any>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [arenaInvites, setArenaInvites] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // Only count submitted attempts (not in_progress pre-created placeholders)
  const [submittedAttempts, setSubmittedAttempts] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    });

    if (id) {
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const loadData = async () => {
    try {
      if (!arena) setLoading(true);
      setError(null);

      const [arenaData, roundsData, participantsData] = await Promise.all([
        getArena(id),
        getArenaRounds(id),
        getParticipants(id),
      ]);

      // Only load friends/invites for non-daily arenas
      let friendsData: any[] = [];
      let invitesData: any[] = [];
      if (!isDailyArena(arenaData)) {
        [friendsData, invitesData] = await Promise.all([
          getFriends().catch(() => []),
          getArenaInvites(id).catch(() => []),
        ]);
      }

      const activeRounds = roundsData.filter((r: any) => r.status === 'active');
      const attemptsResults = await Promise.all(
        activeRounds.map((r: any) => getMyAttempts(id, r.id).catch(() => []))
      );
      const allAttempts = attemptsResults.flat();
      // Only submitted/timed_out/void attempts mean the player has played this round
      const submitted = allAttempts.filter(
        (a: any) => a.status === 'submitted' || a.status === 'timed_out' || a.status === 'void'
      );

      setArena(arenaData);
      setRounds(roundsData.sort((a: any, b: any) => a.round_number - b.round_number));
      setParticipants(participantsData);
      setFriends(friendsData);
      setArenaInvites(invitesData.filter((i: any) => i.status === 'pending'));
      setSubmittedAttempts(submitted);
    } catch (err: any) {
      setError(err.message || 'Failed to load arena details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartArena = async () => {
    try {
      setActionLoading(true);
      const idempotencyKey = uuidv4();
      await startArena(id, idempotencyKey);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to start arena');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvite = async (friendId: string) => {
    try {
      await sendInvite(id, friendId, uuidv4());
      // Refresh invites list so UI stays accurate
      const invitesData = await getArenaInvites(id).catch(() => []);
      setArenaInvites(invitesData.filter((i: any) => i.status === 'pending'));
      Alert.alert('✅', 'Invite sent!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send invite');
    }
  };

  const handleStartRound = (roundId: string) => {
    router.push({
      pathname: '/arena/play',
      params: { arenaId: id, roundId }
    } as any);
  };

  if (loading && !arena) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  const isDaily = isDailyArena(arena);
  // Determine host status (not relevant for Daily Arena)
  const isHost = !isDaily && currentUserId === arena?.host_user_id;
  const isPending = arena?.status === 'pending';
  const allCompleted = rounds.length > 0 && rounds.every(r => r.status === 'completed');
  const completedCount = rounds.filter(r => r.status === 'completed').length;

  // Participants split by status
  const activeParticipants = participants.filter(p => p.status === 'active');
  const pendingInvites = arenaInvites; // already filtered to pending

  // For Daily Arena: auto-start is implicit — the arena is always 'pending' for one player.
  // Daily Arena does NOT require 2 participants.
  const canStartCustomArena = !isDaily && isHost && activeParticipants.length >= 2;

  // Invite button: show if active participants + pending invites < max_participants
  // (for Custom Arena only)
  const canInviteMore = !isDaily && isPending && isHost &&
    (activeParticipants.length + pendingInvites.length) < (arena?.max_participants || 2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isDaily ? 'Daily Arena' : 'Arena Lobby'}</Text>
        <View style={styles.placeholder} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {arena && (
        <>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{isDaily ? '📅 Daily Arena' : `${arena.category || 'Mixed'} Arena`}</Text>
            <Text style={styles.infoText}>Status: <Text style={styles.highlight}>{arena.status}</Text></Text>
            {!isDaily && <Text style={styles.infoText}>Difficulty: {arena.difficulty || 'Any'}</Text>}
            <Text style={styles.infoText}>Time Limit: {arena.time_limit_seconds}s per round</Text>
            {isDaily && (
              <Text style={styles.dailyModeText}>Solo mode — no other players required</Text>
            )}
          </View>

          {/* Participants Section — Custom Arena only */}
          {!isDaily && (
            <View style={styles.participantsCard}>
              <Text style={styles.participantsTitle}>Players</Text>

              {activeParticipants.length === 0 ? (
                <Text style={styles.emptyParticipant}>No players joined yet</Text>
              ) : (
                activeParticipants.map((p: any) => (
                  <View key={p.user_id} style={styles.participantRow}>
                    {p.avatar_url ? (
                      <Image source={{ uri: p.avatar_url }} style={styles.participantAvatar} />
                    ) : (
                      <View style={styles.participantAvatarPlaceholder}>
                        <Text style={styles.participantAvatarText}>
                          {(p.username || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>
                        {p.username || 'Player'}
                        {p.user_id === arena?.host_user_id ? ' 👑' : ''}
                      </Text>
                      <Text style={styles.participantStatus}>Joined</Text>
                    </View>
                  </View>
                ))
              )}

              {pendingInvites.length > 0 && (
                <>
                  <Text style={styles.pendingTitle}>Pending Invites</Text>
                  {pendingInvites.map((invite: any) => (
                    <View key={invite.id} style={styles.participantRow}>
                      <View style={styles.participantAvatarPlaceholder}>
                        <Text style={styles.participantAvatarText}>?</Text>
                      </View>
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>Invited Player</Text>
                        <Text style={styles.participantStatusPending}>Pending</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(completedCount / Math.max(1, rounds.length)) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Round {completedCount} of {rounds.length} completed
            </Text>
          </View>

          {/* Custom Arena host controls */}
          {!isDaily && isPending && isHost && (
            <View style={styles.hostActions}>
              <TouchableOpacity
                style={[
                  styles.startArenaButton,
                  (!canStartCustomArena || actionLoading) && styles.disabledButton,
                  { flex: 1, marginRight: canInviteMore ? 8 : 0 }
                ]}
                onPress={handleStartArena}
                disabled={!canStartCustomArena || actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.startArenaButtonText}>
                    {activeParticipants.length < 2 ? 'Waiting for players...' : 'Start Arena'}
                  </Text>
                )}
              </TouchableOpacity>

              {canInviteMore && (
                <TouchableOpacity
                  style={[styles.inviteArenaButton, { flex: 1, marginLeft: 8 }]}
                  onPress={() => setInviteModalVisible(true)}
                >
                  <Text style={styles.startArenaButtonText}>Invite Friends</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Daily Arena — single-player start: trigger start immediately */}
          {isDaily && isPending && (
            <TouchableOpacity
              style={[styles.startArenaButton, actionLoading && styles.disabledButton]}
              onPress={handleStartArena}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.startArenaButtonText}>Start Daily Arena</Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.roundsContainer}>
            {rounds.map((round) => {
              const hasSubmitted = submittedAttempts.some(a => a.round_id === round.id);
              const canPlay = round.status === 'active' && !hasSubmitted;
              return (
                <View key={round.id} style={styles.roundCard}>
                  <View style={styles.roundHeader}>
                    <Text style={styles.roundNumber}>Round {round.round_number}</Text>
                    <View style={[
                      styles.roundStatus,
                      round.status === 'completed' && styles.statusCompleted,
                      round.status === 'active' && styles.statusActive,
                      round.status === 'pending' && styles.statusPending,
                    ]}>
                      <Text style={styles.roundStatusText}>
                        {round.status === 'completed' && '✅ Done'}
                        {round.status === 'active' && '▶ Active'}
                        {round.status === 'pending' && '⏳ Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.roundBody}>
                    <Text style={styles.roundIcon}>❓</Text>
                    <View style={styles.roundInfo}>
                      <Text style={styles.roundName}>{round.question_category}</Text>
                      <Text style={styles.roundDesc}>Difficulty: {round.question_difficulty}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.roundButton,
                        !canPlay && styles.roundButtonDisabled,
                        round.status === 'completed' && styles.roundButtonCompleted,
                      ]}
                      onPress={() => handleStartRound(round.id)}
                      disabled={!canPlay}
                    >
                      <Text style={styles.roundButtonText}>
                        {round.status === 'completed' ? 'Review' :
                         round.status === 'active' ? (hasSubmitted ? 'Waiting...' : 'Play') : 'Locked'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {allCompleted && (
            <TouchableOpacity
              style={styles.resultsButton}
              onPress={() => router.push(`/arena/results?arenaId=${id}`)}
            >
              <Text style={styles.resultsButtonText}>📊 View Results</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Invite Modal — Custom Arena only */}
      {!isDaily && (
        <Modal visible={inviteModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Invite Friends</Text>

              <ScrollView style={styles.friendsList}>
                {friends.length === 0 ? (
                  <Text style={styles.emptyText}>No friends to invite.</Text>
                ) : (
                  friends.map(friend => (
                    <View key={friend.friend_id} style={styles.friendRow}>
                      <Text style={styles.friendName}>{friend.friend_username}</Text>
                      <TouchableOpacity style={styles.inviteButton} onPress={() => handleInvite(friend.friend_id)}>
                        <Text style={styles.inviteButtonText}>Invite</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>

              <TouchableOpacity style={styles.closeModalButton} onPress={() => setInviteModalVisible(false)}>
                <Text style={styles.closeModalText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#121224',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f3a',
    marginBottom: 16,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  highlight: {
    color: '#fdcb6e',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dailyModeText: {
    color: '#6c5ce7',
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  participantsCard: {
    backgroundColor: '#121224',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f3a',
    marginBottom: 16,
  },
  participantsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pendingTitle: {
    color: '#8888aa',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyParticipant: {
    color: '#8888aa',
    fontSize: 14,
    fontStyle: 'italic',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a3a',
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  participantAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a5a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: '#818cf8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  participantStatus: {
    color: '#00b894',
    fontSize: 12,
    marginTop: 2,
  },
  participantStatusPending: {
    color: '#fdcb6e',
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1a1a3a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6c5ce7',
    borderRadius: 3,
  },
  progressText: {
    color: '#8888aa',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  startArenaButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  startArenaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roundsContainer: {
    gap: 16,
  },
  roundCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundNumber: {
    color: '#8888aa',
    fontSize: 12,
    fontWeight: '600',
  },
  roundStatus: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusCompleted: {
    backgroundColor: '#00b89433',
  },
  statusActive: {
    backgroundColor: '#6c5ce733',
  },
  statusPending: {
    backgroundColor: '#636e7233',
  },
  roundStatusText: {
    fontSize: 11,
    color: '#ffffff',
  },
  roundBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  roundInfo: {
    flex: 1,
  },
  roundName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  roundDesc: {
    color: '#8888aa',
    fontSize: 12,
    marginTop: 2,
  },
  roundButton: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  roundButtonDisabled: {
    backgroundColor: '#2a2a5a',
  },
  roundButtonCompleted: {
    backgroundColor: '#00b894',
  },
  roundButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  resultsButton: {
    backgroundColor: '#fdcb6e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  resultsButtonText: {
    color: '#0a0a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hostActions: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  inviteArenaButton: {
    backgroundColor: '#0984e3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a5a',
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  friendsList: {
    marginBottom: 16,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    padding: 20,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a5a',
  },
  friendName: {
    color: '#fff',
    fontSize: 16,
  },
  inviteButton: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeModalButton: {
    backgroundColor: '#fdcb6e',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

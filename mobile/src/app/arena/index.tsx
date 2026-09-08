import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { getArenaState, setArenaIds } from '../../state/arenaState';
import { supabase } from '../../lib/supabase';

type Round = 'word' | 'cipher' | 'number';

export default function ArenaScreen() {
  const [rounds, setRounds] = useState(getArenaState());
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [saveResultError, setSaveResultError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initArena = async () => {
      try {
        setIsLoading(true);
        setInitError(null);

        // 1. Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('Authentication required to play Arena.');
        }

        // 2. Fetch today's active arena
        // Use local date (not UTC) to avoid timezone mismatch for users in UTC+ zones
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        console.log('[Arena] Querying daily_arenas for arena_date:', today);

        // FIX: column is arena_date (not date), and filter status = active
        const { data: arenaData, error: arenaError } = await supabase
          .from('daily_arenas')
          .select('id')
          .eq('arena_date', today)
          .eq('status', 'active')
          .maybeSingle();

        console.log('[Arena] arenaData:', arenaData, 'arenaError:', arenaError);

        if (arenaError || !arenaData) {
          throw new Error(`No active arena found for today (${today}). Please ensure a daily arena has been created.`);
        }

        const arenaId = arenaData.id;
        let attemptId = null;

        // 3. Check for existing attempt
        const { data: existingAttempt, error: attemptError } = await supabase
          .from('arena_attempts')
          .select('id')
          .eq('arena_id', arenaId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (attemptError) {
          throw new Error('Failed to verify arena attempt status.');
        }

        if (existingAttempt) {
          attemptId = existingAttempt.id;
        } else {
          // 4. Create new attempt
          const { data: newAttempt, error: createError } = await supabase
            .from('arena_attempts')
            .insert({
              arena_id: arenaId,
              user_id: user.id,
              status: 'in_progress',
              total_score: 0,
              correct_count: 0
            })
            .select('id')
            .single();

          if (createError || !newAttempt) {
            console.error('[Arena] createError full details:', JSON.stringify(createError));
            throw new Error(`Failed to create arena attempt. Code: ${createError?.code} — ${createError?.message}`);
          }
          attemptId = newAttempt.id;
        }

        if (mounted) {
          // 5. Store in state
          setArenaIds(arenaId, attemptId);
          setRounds({ ...getArenaState() });
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Arena initialization error:', err);
        if (mounted) {
          setInitError(err.message || 'An unexpected error occurred while starting the Arena.');
          setIsLoading(false);
        }
      }
    };

    initArena();
    return () => { mounted = false; };
  }, []);

  // Refresh state every time the screen is shown
  useEffect(() => {
    const interval = setInterval(() => {
      const currentState = getArenaState();
      setRounds({ ...currentState });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const roundNames: Record<Round, string> = {
    word: 'Word Duel',
    cipher: 'Cipher Break',
    number: 'Number Rush',
  };

  const roundIcons: Record<Round, string> = {
    word: '📝',
    cipher: '🔐',
    number: '🔢',
  };

  const roundRoutes: Record<Round, string> = {
    word: '/arena/word-duel',
    cipher: '/arena/cipher-break',
    number: '/arena/number-rush',
  };

  const handleStartRound = (round: Round) => {
    const route = roundRoutes[round];
    router.push(route as any);
  };

  const handleContinue = async () => {
    try {
      setIsSavingResult(true);
      setSaveResultError(null);

      const state = getArenaState();
      if (!state.attemptId) {
        throw new Error('No valid attempt ID found. Cannot complete arena.');
      }

      // 1. Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required.');
      }

      const totalScore = state.word.points + state.cipher.points + state.number.points;
      const correctCount = (state.word.isCorrect ? 1 : 0) + (state.cipher.isCorrect ? 1 : 0) + (state.number.isCorrect ? 1 : 0);

      // 2. Update the arena_attempts row
      const { error: updateError } = await supabase
        .from('arena_attempts')
        .update({
          status: 'completed',
          total_score: totalScore,
          correct_count: correctCount,
          completed_at: new Date().toISOString(),
        })
        .eq('id', state.attemptId)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error('Failed to save arena completion status.');
      }

      router.push({
        pathname: '/arena/results',
        params: {
          attemptId: state.attemptId,
          wordPoints: state.word.points,
          cipherPoints: state.cipher.points,
          numberPoints: state.number.points,
          wordCorrect: String(state.word.isCorrect),
          cipherCorrect: String(state.cipher.isCorrect),
          numberCorrect: String(state.number.isCorrect),
        }
      });
    } catch (err: any) {
      console.error('Complete arena error:', err);
      setSaveResultError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSavingResult(false);
    }
  };

  const roundKeys: Round[] = ['word', 'cipher', 'number'];
  const allCompleted = roundKeys.every(k => rounds[k].status === 'completed');
  const completedCount = roundKeys.filter(k => rounds[k].status === 'completed').length;

  // Force refresh when component mounts
  useEffect(() => {
    setRounds({ ...getArenaState() });
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>Initializing Arena...</Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error</Text>
        <Text style={styles.errorDesc}>{initError}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Daily Arena</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(completedCount / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {completedCount} of 3 completed
        </Text>
      </View>

      <View style={styles.roundsContainer}>
        {(['word', 'cipher', 'number'] as Round[]).map((round, index) => (
          <View key={round} style={styles.roundCard}>
            <View style={styles.roundHeader}>
              <Text style={styles.roundNumber}>Round {index + 1}</Text>
              <View style={[
                styles.roundStatus,
                rounds[round].status === 'completed' && styles.statusCompleted,
                rounds[round].status === 'active' && styles.statusActive,
                rounds[round].status === 'pending' && styles.statusPending,
              ]}>
                <Text style={styles.roundStatusText}>
                  {rounds[round].status === 'completed' && '✅ Done'}
                  {rounds[round].status === 'active' && '▶ Active'}
                  {rounds[round].status === 'pending' && '⏳ Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.roundBody}>
              <Text style={styles.roundIcon}>{roundIcons[round]}</Text>
              <View style={styles.roundInfo}>
                <Text style={styles.roundName}>{roundNames[round]}</Text>
                <Text style={styles.roundDesc}>
                  {round === 'word' && 'Find the word from scrambled letters'}
                  {round === 'cipher' && 'Decode the encrypted message'}
                  {round === 'number' && 'Solve the number puzzle'}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.roundButton,
                  rounds[round].status === 'pending' && styles.roundButtonDisabled,
                  rounds[round].status === 'completed' && styles.roundButtonCompleted,
                ]}
                onPress={() => {
                  if (rounds[round].status === 'pending') return;
                  handleStartRound(round);
                }}
                disabled={rounds[round].status === 'pending'}
              >
                <Text style={styles.roundButtonText}>
                  {rounds[round].status === 'completed' ? 'Review' : 
                   rounds[round].status === 'active' ? 'Start' : 'Locked'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {allCompleted && (
        <View style={styles.resultsContainer}>
          {saveResultError && (
            <Text style={styles.saveErrorText}>{saveResultError}</Text>
          )}
          <TouchableOpacity 
            style={[styles.resultsButton, isSavingResult && styles.resultsButtonDisabled]} 
            onPress={handleContinue}
            disabled={isSavingResult}
          >
            <Text style={styles.resultsButtonText}>
              {isSavingResult ? 'Saving...' : (saveResultError ? 'Retry →' : '📊 View Results')}
            </Text>
          </TouchableOpacity>
        </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#8888aa',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorDesc: {
    color: '#8888aa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#1a1a3a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  resultsContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  saveErrorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultsButton: {
    backgroundColor: '#fdcb6e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  resultsButtonDisabled: {
    backgroundColor: '#2a2a5a',
  },
  resultsButtonText: {
    color: '#0a0a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

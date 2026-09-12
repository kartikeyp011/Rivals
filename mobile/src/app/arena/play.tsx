import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getArenaRounds, submitAttempt } from '../../lib/api';

export default function PlayRoundScreen() {
  const { arenaId, roundId } = useLocalSearchParams<{ arenaId: string, roundId: string }>();
  
  const [round, setRound] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Result state
  const [result, setResult] = useState<any>(null); // For successful or terminal result
  const [transientFeedback, setTransientFeedback] = useState<string | null>(null); // For incorrect guess
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (arenaId && roundId) {
      loadRound();
    }
  }, [arenaId, roundId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (round && round.ends_at && !result && !isTimeUp) {
      const endsAtMs = new Date(round.ends_at).getTime();
      
      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((endsAtMs - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          setIsTimeUp(true);
          clearInterval(interval);
        }
      };
      
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(interval);
  }, [round, result, isTimeUp]);

  const loadRound = async () => {
    try {
      setLoading(true);
      setError(null);
      const roundsData = await getArenaRounds(arenaId);
      const currentRound = roundsData.find((r: any) => r.id === roundId);
      if (!currentRound) throw new Error("Round not found");
      setRound(currentRound);
      
      if (currentRound.status === 'completed') {
        setError("This round is already completed.");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load round details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selected || isTimeUp) return;
    try {
      setSubmitting(true);
      setError(null);
      setTransientFeedback(null);
      
      const responseMs = Date.now() - startTime;
      const idempotencyKey = Math.random().toString(36).substring(7);
      
      const attemptRes = await submitAttempt(arenaId, roundId, selected, responseMs, idempotencyKey);
      
      if (attemptRes.is_correct) {
        setResult(attemptRes);
      } else if (attemptRes.status === 'timed_out' || attemptRes.status === 'void') {
        // Technically backend handled it as terminal
        setIsTimeUp(true);
      } else {
        // Incorrect, let them try again
        setTransientFeedback("Incorrect! Keep trying.");
        setSelected(null);
      }
    } catch (err: any) {
      // 409 usually means time limit expired or already submitted
      if (err.message && err.message.toLowerCase().includes('expired')) {
        setIsTimeUp(true);
      } else {
        setError(err.message || 'Failed to submit answer');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  if (error && !round) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (result) {
    const points = result.points_awarded || 0;
    return (
      <View style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>✅</Text>
          <Text style={[styles.resultText, styles.correctText]}>Correct!</Text>
          <Text style={styles.resultSubtext}>+{points} points earned!</Text>
          <TouchableOpacity style={styles.continueButton} onPress={() => router.replace(`/arena/${arenaId}` as any)}>
            <Text style={styles.continueButtonText}>Return to Lobby →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isTimeUp) {
    return (
      <View style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>⏳</Text>
          <Text style={[styles.resultText, styles.incorrectText]}>Time's Up!</Text>
          <Text style={styles.resultSubtext}>You ran out of time for this round.</Text>
          <TouchableOpacity style={styles.continueButton} onPress={() => router.replace(`/arena/${arenaId}` as any)}>
            <Text style={styles.continueButtonText}>Return to Lobby →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonTop}>
          <Text style={styles.backTextTop}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Round {round.round_number}</Text>
        <View style={styles.timerContainer}>
          {timeLeft !== null && (
            <Text style={[styles.timerText, timeLeft <= 5 && styles.timerWarning]}>
              {timeLeft}s
            </Text>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {transientFeedback && (
          <View style={styles.transientFeedbackContainer}>
            <Text style={styles.transientFeedbackText}>{transientFeedback}</Text>
          </View>
        )}

        <View style={styles.puzzleCard}>
          <Text style={styles.roundLabel}>{round.question_category} • {round.question_difficulty}</Text>
          <Text style={styles.puzzleTitle}>{round.question_prompt}</Text>
          
          <View style={styles.optionsContainer}>
            {round.question_options?.map((opt: any) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionButton,
                  selected === opt.id && styles.optionSelected
                ]}
                onPress={() => setSelected(opt.id)}
                disabled={submitting}
              >
                <Text style={styles.optionLabel}>{opt.id}</Text>
                <Text style={styles.optionText}>{opt.text}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, (!selected || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selected || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Answer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    marginBottom: 20,
  },
  backButtonTop: {
    padding: 8,
  },
  backTextTop: {
    color: '#ffffff',
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  timerContainer: {
    width: 60,
    alignItems: 'flex-end',
  },
  timerText: {
    color: '#00b894',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerWarning: {
    color: '#ff6b6b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  puzzleCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a5a',
    flex: 1,
    marginBottom: 20,
  },
  roundLabel: {
    color: '#8888aa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  puzzleTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    lineHeight: 30,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2a2a5a',
  },
  optionSelected: {
    borderColor: '#6c5ce7',
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  optionLabel: {
    color: '#fdcb6e',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 16,
    width: 24,
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  submitButtonDisabled: {
    backgroundColor: '#2a2a5a',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
    fontSize: 16,
    textAlign: 'center',
  },
  transientFeedbackContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
    marginBottom: 20,
  },
  transientFeedbackText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#2a2a5a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  correctText: {
    color: '#00b894',
  },
  incorrectText: {
    color: '#ff6b6b',
  },
  resultSubtext: {
    color: '#8888aa',
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#00b894',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

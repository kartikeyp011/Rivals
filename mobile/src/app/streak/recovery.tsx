import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import * as api from '@/lib/api';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function StreakRecoveryScreen() {
  const [streak, setStreak] = useState(0);
  const [recoveryAvailable, setRecoveryAvailable] = useState(false);
  const [recovered, setRecovered] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const state = await api.getStreak();
        setStreak(state.current_streak);
        setRecoveryAvailable(state.recovery_available);
      } catch (e) {
        console.error('Failed to fetch streak', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStreak();
  }, []);

  const handleRecover = async () => {
    try {
      setLoading(true);
      const idempotencyKey = uuidv4();
      const res = await api.recoverStreak(idempotencyKey);
      setRecovered(true);
      setStreak(res.current_streak);
    } catch (e: any) {
      alert(e.message || 'Failed to recover streak');
    } finally {
      setLoading(false);
    }
  };

  if (recovered) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🔥</Text>
          <Text style={styles.title}>Streak Restored!</Text>
          <Text style={styles.subtitle}>Your streak is now {streak} days!</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔥</Text>
        <Text style={styles.title}>Streak Recovery</Text>
        <Text style={styles.subtitle}>You missed a day! Use your free recovery to restore your streak.</Text>
        
        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={styles.streakValue}>{streak} days</Text>
        </View>

        {recoveryAvailable ? (
          <TouchableOpacity style={styles.recoverButton} onPress={handleRecover}>
            <Text style={styles.recoverButtonText}>🔥 Use Free Recovery</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.noRecoveryCard}>
            <Text style={styles.noRecoveryText}>No recoveries available</Text>
            <Text style={styles.noRecoverySubtext}>Subscribe to Rivals+ for more</Text>
          </View>
        )}

        <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8888aa',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  streakCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a5a',
    marginBottom: 24,
  },
  streakLabel: {
    color: '#8888aa',
    fontSize: 14,
  },
  streakValue: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 4,
  },
  recoverButton: {
    backgroundColor: '#fdcb6e',
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  recoverButtonText: {
    color: '#0a0a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noRecoveryCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff6b6b33',
    marginBottom: 24,
  },
  noRecoveryText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
  noRecoverySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

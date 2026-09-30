import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getArenaConfigOptions, createArena } from '../../lib/api';
import { v4 as uuidv4 } from 'uuid';
import { useAdVisibility } from '../../hooks/useAdVisibility';
import { useRewardedAd } from '../../hooks/useRewardedAd';

export default function CreateArenaScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAdFree } = useAdVisibility();
  const { showRewardedAd, isShowing } = useRewardedAd();

  const [config, setConfig] = useState<any>(null);

  // Selections
  const [category, setCategory] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [maxRounds, setMaxRounds] = useState<number>(3);
  const [maxParticipants, setMaxParticipants] = useState<number>(2);
  const [timeLimit, setTimeLimit] = useState<number>(30);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await getArenaConfigOptions();
      setConfig(data);
      if (data.max_rounds_min) setMaxRounds(Math.max(3, data.max_rounds_min));
      if (data.max_participants_min) setMaxParticipants(data.max_participants_min);
      if (data.time_limit_seconds_min) setTimeLimit(Math.max(30, data.time_limit_seconds_min));
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration options');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const payload: any = {
        max_rounds: maxRounds,
        max_participants: maxParticipants,
        time_limit_seconds: timeLimit,
      };

      if (category) payload.category = category;
      if (difficulty) payload.difficulty = difficulty;

      const idempotencyKey = uuidv4();

      const proceedWithCreation = async (adIntentId?: string) => {
        try {
          const arena = await createArena(payload, idempotencyKey, adIntentId);
          router.replace(`/arena/${arena.id}` as any);
        } catch (err: any) {
          setError(err.message || 'Failed to create arena');
          setSubmitting(false);
        }
      };

      if (!isAdFree) {
        await showRewardedAd(
          'create_arena',
          (intentId) => proceedWithCreation(intentId),
          (err) => {
            setError(err.message || 'Ad was not completed.');
            setSubmitting(false);
          }
        );
      } else {
        await proceedWithCreation();
      }

    } catch (err: any) {
      setError(err.message || 'Failed to initialize creation');
      setSubmitting(false);
    }
  };

  if (loading || isShowing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>
          {isShowing ? 'Loading Ad...' : 'Loading options...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Custom Arena</Text>
        <View style={styles.placeholder} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {config && (
        <View style={styles.form}>
          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionButton, !category && styles.optionSelected]}
              onPress={() => setCategory(null)}
            >
              <Text style={styles.optionText}>Any</Text>
            </TouchableOpacity>
            {config.categories?.map((cat: string) => (
              <TouchableOpacity
                key={cat}
                style={[styles.optionButton, category === cat && styles.optionSelected]}
                onPress={() => setCategory(cat)}
              >
                <Text style={styles.optionText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Difficulty */}
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionButton, !difficulty && styles.optionSelected]}
              onPress={() => setDifficulty(null)}
            >
              <Text style={styles.optionText}>Any</Text>
            </TouchableOpacity>
            {config.difficulties?.map((diff: string) => (
              <TouchableOpacity
                key={diff}
                style={[styles.optionButton, difficulty === diff && styles.optionSelected]}
                onPress={() => setDifficulty(diff)}
              >
                <Text style={styles.optionText}>{diff}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rounds */}
          <Text style={styles.label}>Rounds: {maxRounds}</Text>
          <View style={styles.optionsRow}>
            {[1, 3, 5, 10].map(val => (
              <TouchableOpacity
                key={val}
                style={[styles.optionButton, maxRounds === val && styles.optionSelected]}
                onPress={() => setMaxRounds(val)}
                disabled={val < config.max_rounds_min || val > config.max_rounds_max}
              >
                <Text style={styles.optionText}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Max Participants */}
          <Text style={styles.label}>Max Participants: {maxParticipants}</Text>
          <View style={styles.optionsRow}>
            {[2, 3, 4, 5, 6, 7, 8].map(val => (
              <TouchableOpacity
                key={val}
                style={[styles.optionButton, maxParticipants === val && styles.optionSelected]}
                onPress={() => setMaxParticipants(val)}
                disabled={config.max_participants_min ? val < config.max_participants_min : false}
              >
                <Text style={styles.optionText}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Time Limit */}
          <Text style={styles.label}>Time Limit: {timeLimit}s</Text>
          <View style={styles.optionsRow}>
            {[15, 30, 60, 120].map(val => (
              <TouchableOpacity
                key={val}
                style={[styles.optionButton, timeLimit === val && styles.optionSelected]}
                onPress={() => setTimeLimit(val)}
                disabled={val < config.time_limit_seconds_min || val > config.time_limit_seconds_max}
              >
                <Text style={styles.optionText}>{val}s</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleCreate}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Create Arena</Text>
        )}
      </TouchableOpacity>
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
  loadingText: {
    color: '#8888aa',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
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
  form: {
    marginBottom: 30,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#1a1a3a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  optionSelected: {
    backgroundColor: '#6c5ce7',
    borderColor: '#818cf8',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 14,
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
  submitButton: {
    backgroundColor: '#fdcb6e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#0a0a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

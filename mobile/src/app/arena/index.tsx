import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';

type Round = 'word' | 'cipher' | 'number';
type RoundStatus = 'pending' | 'active' | 'completed';

export default function ArenaScreen() {
  const [rounds, setRounds] = useState<Record<Round, RoundStatus>>({
    word: 'active',
    cipher: 'pending',
    number: 'pending',
  });

  const roundNames: Record<Round, string> = {
    word: 'Word Duel',
    cipher: 'Cipher Break',
    number: 'Number Rush',
  };

  const roundPaths: Record<Round, string> = {
    word: 'word-duel',
    cipher: 'cipher-break',
    number: 'number-rush',
  };

  const roundIcons: Record<Round, string> = {
    word: '📝',
    cipher: '🔐',
    number: '🔢',
  };

  const handleStartRound = (round: Round) => {
    const routeName = roundPaths[round] || round;
    router.push(`/arena/${routeName}` as any);
  };

  const handleContinue = () => {
    router.push('/arena/results');
  };

  const allCompleted = Object.values(rounds).every(status => status === 'completed');

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
          <View style={[styles.progressFill, { width: `${(Object.values(rounds).filter(s => s === 'completed').length / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {Object.values(rounds).filter(s => s === 'completed').length} of 3 completed
        </Text>
      </View>

      <View style={styles.roundsContainer}>
        {(['word', 'cipher', 'number'] as Round[]).map((round, index) => (
          <View key={round} style={styles.roundCard}>
            <View style={styles.roundHeader}>
              <Text style={styles.roundNumber}>Round {index + 1}</Text>
              <View style={[
                styles.roundStatus,
                rounds[round] === 'completed' && styles.statusCompleted,
                rounds[round] === 'active' && styles.statusActive,
                rounds[round] === 'pending' && styles.statusPending,
              ]}>
                <Text style={styles.roundStatusText}>
                  {rounds[round] === 'completed' && '✅ Done'}
                  {rounds[round] === 'active' && '▶ Active'}
                  {rounds[round] === 'pending' && '⏳ Pending'}
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
                  rounds[round] === 'pending' && styles.roundButtonDisabled,
                  rounds[round] === 'completed' && styles.roundButtonCompleted,
                ]}
                onPress={() => {
                  if (rounds[round] === 'pending') return;
                  handleStartRound(round);
                }}
                disabled={rounds[round] === 'pending'}
              >
                <Text style={styles.roundButtonText}>
                  {rounds[round] === 'completed' ? 'Review' :
                    rounds[round] === 'active' ? 'Start' : 'Locked'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {allCompleted && (
        <TouchableOpacity style={styles.resultsButton} onPress={handleContinue}>
          <Text style={styles.resultsButtonText}>📊 View Results</Text>
        </TouchableOpacity>
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
});

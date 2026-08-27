import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function ArenaResultsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Arena Complete!</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Your Arena Score</Text>
          <Text style={styles.scoreValue}>2,847</Text>
          <View style={styles.scoreBreakdown}>
            <View style={styles.roundScore}>
              <Text style={styles.roundScoreLabel}>Word Duel</Text>
              <Text style={styles.roundScoreValue}>950</Text>
            </View>
            <View style={styles.roundScore}>
              <Text style={styles.roundScoreLabel}>Cipher Break</Text>
              <Text style={styles.roundScoreValue}>1,247</Text>
            </View>
            <View style={styles.roundScore}>
              <Text style={styles.roundScoreLabel}>Number Rush</Text>
              <Text style={styles.roundScoreValue}>650</Text>
            </View>
          </View>
        </View>

        <View style={styles.rankCard}>
          <Text style={styles.rankTitle}>📊 Daily Rankings</Text>
          <View style={styles.rankRow}>
            <Text style={styles.rankLabel}>Friends Rank</Text>
            <Text style={styles.rankValue}>#2</Text>
          </View>
          <View style={styles.rankRow}>
            <Text style={styles.rankLabel}>Global Rank</Text>
            <Text style={styles.rankValue}>#127</Text>
          </View>
        </View>

        <View style={styles.streakCard}>
          <Text style={styles.streakText}>🔥 0 Day Streak</Text>
          <Text style={styles.streakSubtext}>Complete tomorrow's Arena to continue!</Text>
        </View>

        <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.homeButtonText}>Return Home</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  scoreCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a5a',
    marginBottom: 16,
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#8888aa',
    fontSize: 14,
    marginBottom: 4,
  },
  scoreValue: {
    color: '#fdcb6e',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scoreBreakdown: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#2a2a5a',
    paddingTop: 16,
  },
  roundScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  roundScoreLabel: {
    color: '#8888aa',
    fontSize: 14,
  },
  roundScoreValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  rankCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a5a',
    marginBottom: 16,
  },
  rankTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rankLabel: {
    color: '#8888aa',
    fontSize: 14,
  },
  rankValue: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: 'bold',
  },
  streakCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a5a',
    alignItems: 'center',
    marginBottom: 24,
  },
  streakText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  streakSubtext: {
    color: '#8888aa',
    fontSize: 14,
    marginTop: 4,
  },
  homeButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { rewardArenaCoins } from '@/state/coinState';
import { updateStreak, getStreakState } from '@/state/streakState';

export default function ArenaResultsScreen() {
  const params = useLocalSearchParams();
  
  const wordPoints = parseInt(params.wordPoints as string) || 0;
  const cipherPoints = parseInt(params.cipherPoints as string) || 0;
  const numberPoints = parseInt(params.numberPoints as string) || 0;
  const wordCorrect = params.wordCorrect === 'true';
  const cipherCorrect = params.cipherCorrect === 'true';
  const numberCorrect = params.numberCorrect === 'true';
  
  const totalScore = wordPoints + cipherPoints + numberPoints;
  const correctCount = (wordCorrect ? 1 : 0) + (cipherCorrect ? 1 : 0) + (numberCorrect ? 1 : 0);
  const maxPossibleScore = 100 + 150 + 200; // 450
  const percentage = Math.round((totalScore / maxPossibleScore) * 100);
  
  const getGrade = () => {
    if (percentage >= 80) return { label: '🏆 Excellent!', color: '#fdcb6e' };
    if (percentage >= 60) return { label: '⭐ Great Job!', color: '#00b894' };
    if (percentage >= 40) return { label: '💪 Keep Going!', color: '#6c5ce7' };
    return { label: '📚 Practice More!', color: '#ff6b6b' };
  };
  
  const grade = getGrade();
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Reward coins and update streak when results are shown
  useEffect(() => {
    // Update streak
    updateStreak();
    const streakState = getStreakState();
    setCurrentStreak(streakState.currentStreak);
    // Reward coins
    const earned = rewardArenaCoins(totalScore, correctCount);
    setEarnedCoins(earned);
    console.log(`🎉 Earned ${earned} coins for Arena completion!`);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Arena Complete!</Text>
      </View>

      {/* Score Card */}
      <View style={styles.scoreCard}>
        <Text style={styles.gradeEmoji}>{grade.label}</Text>
        <Text style={styles.scoreLabel}>Your Arena Score</Text>
        <Text style={styles.scoreValue}>{totalScore}</Text>
        <View style={styles.percentageContainer}>
          <View style={styles.percentageBar}>
            <View style={[styles.percentageFill, { width: `${percentage}%` }]} />
          </View>
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>
        <Text style={styles.correctCount}>{correctCount} of 3 correct</Text>
      </View>

      {/* Round Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>📊 Round Breakdown</Text>
        
        <View style={styles.roundRow}>
          <View style={styles.roundInfo}>
            <Text style={styles.roundIcon}>📝</Text>
            <Text style={styles.roundName}>Word Duel</Text>
          </View>
          <View style={styles.roundResult}>
            <Text style={[styles.roundPoints, wordCorrect ? styles.correct : styles.incorrect]}>
              {wordPoints} pts
            </Text>
            <Text style={[styles.roundStatus, wordCorrect ? styles.correctText : styles.incorrectText]}>
              {wordCorrect ? '✅' : '❌'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.roundRow}>
          <View style={styles.roundInfo}>
            <Text style={styles.roundIcon}>🔐</Text>
            <Text style={styles.roundName}>Cipher Break</Text>
          </View>
          <View style={styles.roundResult}>
            <Text style={[styles.roundPoints, cipherCorrect ? styles.correct : styles.incorrect]}>
              {cipherPoints} pts
            </Text>
            <Text style={[styles.roundStatus, cipherCorrect ? styles.correctText : styles.incorrectText]}>
              {cipherCorrect ? '✅' : '❌'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.roundRow}>
          <View style={styles.roundInfo}>
            <Text style={styles.roundIcon}>🔢</Text>
            <Text style={styles.roundName}>Number Rush</Text>
          </View>
          <View style={styles.roundResult}>
            <Text style={[styles.roundPoints, numberCorrect ? styles.correct : styles.incorrect]}>
              {numberPoints} pts
            </Text>
            <Text style={[styles.roundStatus, numberCorrect ? styles.correctText : styles.incorrectText]}>
              {numberCorrect ? '✅' : '❌'}
            </Text>
          </View>
        </View>
      </View>

      {/* Coin Reward Card */}
      <View style={styles.rewardCard}>
        <Text style={styles.rewardEmoji}>🪙</Text>
        <Text style={styles.rewardText}>Coins Earned!</Text>
        <Text style={styles.rewardSubtext}>
          +{earnedCoins} coins for completing the Arena
        </Text>
      </View>

      {/* Streak Card */}
      <View style={styles.streakCard}>
        <Text style={styles.streakText}>🔥 {currentStreak} Day Streak</Text>
        <Text style={styles.streakSubtext}>Complete tomorrow's Arena to continue!</Text>
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.homeButtonText}>🏠 Return Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.leaderboardButton} onPress={() => router.push('/(tabs)/leaderboards')}>
        <Text style={styles.leaderboardButtonText}>🏆 View Leaderboards</Text>
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
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scoreCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a5a',
    alignItems: 'center',
    marginBottom: 16,
  },
  gradeEmoji: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
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
    marginBottom: 12,
  },
  percentageContainer: {
    width: '100%',
    marginBottom: 8,
  },
  percentageBar: {
    height: 8,
    backgroundColor: '#0a0a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    backgroundColor: '#6c5ce7',
    borderRadius: 4,
  },
  percentageText: {
    color: '#8888aa',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  correctCount: {
    color: '#8888aa',
    fontSize: 14,
  },
  breakdownCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a5a',
    marginBottom: 16,
  },
  breakdownTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  roundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  roundName: {
    color: '#ffffff',
    fontSize: 14,
  },
  roundResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundPoints: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  correct: {
    color: '#00b894',
  },
  incorrect: {
    color: '#ff6b6b',
  },
  roundStatus: {
    fontSize: 16,
  },
  correctText: {
    color: '#00b894',
  },
  incorrectText: {
    color: '#ff6b6b',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a5a',
    marginVertical: 4,
  },
  rewardCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fdcb6e33',
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  rewardText: {
    color: '#fdcb6e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rewardSubtext: {
    color: '#8888aa',
    fontSize: 14,
    marginTop: 4,
  },
  streakCard: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a5a',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 10,
  },
  homeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  leaderboardButton: {
    backgroundColor: '#1a1a3a',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  leaderboardButtonText: {
    color: '#8888aa',
    fontSize: 16,
  },
});

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function StartingCoinsScreen() {
  const handleContinue = () => {
    // For now, skip tutorial and go to main app
    // Later we'll add the tutorial Arena
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.coinIcon}>🪙</Text>
        <Text style={styles.title}>You've Got 100 Coins!</Text>
        <Text style={styles.subtitle}>
          Use them to challenge friends and wager on Daily Arenas
        </Text>

        <View style={styles.coinDisplay}>
          <Text style={styles.coinAmount}>100</Text>
          <Text style={styles.coinLabel}>Starting Balance</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 How Coins Work</Text>
          <Text style={styles.infoText}>• Virtual coins have no cash value</Text>
          <Text style={styles.infoText}>• Cannot be withdrawn or cashed out</Text>
          <Text style={styles.infoText}>• Use them for wagers with friends</Text>
          <Text style={styles.infoText}>• Win more by beating friends in Arena</Text>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Enter the Arena →</Text>
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
  coinIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8888aa',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  coinDisplay: {
    backgroundColor: '#1a1a3a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#2a2a5a',
    marginBottom: 32,
  },
  coinAmount: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fdcb6e',
  },
  coinLabel: {
    color: '#8888aa',
    fontSize: 14,
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#1a1a3a',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2a2a5a',
    marginBottom: 32,
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: '#8888aa',
    fontSize: 14,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
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

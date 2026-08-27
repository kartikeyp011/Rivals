import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function WordDuelScreen() {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // For now, just mark as submitted
    // Later this will validate with backend
    setSubmitted(true);
  };

  const handleContinue = () => {
    router.push('/arena');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Word Duel</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.puzzleCard}>
          <Text style={styles.roundLabel}>Round 1 of 3</Text>
          <Text style={styles.puzzleTitle}>Unscramble the Word</Text>
          
          <View style={styles.scrambledContainer}>
            <Text style={styles.scrambledText}>E A R S T</Text>
          </View>

          <Text style={styles.hint}>Hint: It's a common 5-letter word</Text>

          {!submitted ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Type your answer..."
                placeholderTextColor="#555"
                value={answer}
                onChangeText={setAnswer}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={[styles.submitButton, !answer && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!answer}
              >
                <Text style={styles.submitButtonText}>Submit Answer</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.resultContainer}>
              <Text style={styles.resultEmoji}>✅</Text>
              <Text style={styles.resultText}>Answer Submitted!</Text>
              <Text style={styles.resultSubtext}>Waiting for validation...</Text>
              <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
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
  },
  roundLabel: {
    color: '#8888aa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  puzzleTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scrambledContainer: {
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  scrambledText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  hint: {
    color: '#8888aa',
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#2a2a5a',
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#2a2a5a',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultSubtext: {
    color: '#8888aa',
    fontSize: 14,
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#00b894',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

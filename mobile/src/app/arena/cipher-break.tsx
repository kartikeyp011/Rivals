import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { setRoundCompleted } from '../../state/arenaState';

export default function CipherBreakScreen() {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [points, setPoints] = useState(0);

  // Caesar cipher - shift by 4
  // "JRAEGS" shifted back 4 = "FNACO" 
  const correctAnswer = 'FNACO';
  const cipherText = 'J R A E G S';

  const handleSubmit = () => {
    const userAnswer = answer.toUpperCase().trim();
    const correct = userAnswer === correctAnswer;
    setIsCorrect(correct);
    setPoints(correct ? 150 : 0);
    setSubmitted(true);
  };

  const handleContinue = () => {
    setRoundCompleted('cipher', points, isCorrect);
    router.replace('/arena');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cipher Break</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.puzzleCard}>
          <Text style={styles.roundLabel}>Round 2 of 3</Text>
          <Text style={styles.puzzleTitle}>Decode the Cipher</Text>
          
          <View style={styles.cipherContainer}>
            <Text style={styles.cipherText}>{cipherText}</Text>
          </View>

          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>Medium</Text>
          </View>

          <Text style={styles.hint}>Hint: Caesar shift by 4 (A→E, B→F, etc.)</Text>

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
              <Text style={styles.resultEmoji}>{isCorrect ? '✅' : '❌'}</Text>
              <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.incorrectText]}>
                {isCorrect ? 'Correct!' : 'Incorrect!'}
              </Text>
              {isCorrect ? (
                <Text style={styles.resultSubtext}>+150 points earned!</Text>
              ) : (
                <Text style={styles.resultSubtext}>The correct answer was: {correctAnswer}</Text>
              )}
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
  cipherContainer: {
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  cipherText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  difficultyBadge: {
    backgroundColor: '#6c5ce733',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  difficultyText: {
    color: '#6c5ce7',
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  correctText: {
    color: '#00b894',
  },
  incorrectText: {
    color: '#ff6b6b',
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

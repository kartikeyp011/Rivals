import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { setRoundCompleted } from '../../state/arenaState';

export default function NumberRushScreen() {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [points, setPoints] = useState(0);

  // Correct answer: 12 and 15 (12 × 15 = 180, 12 + 15 = 27)
  const correctAnswer = '12,15';
  const sumTarget = 27;
  const productTarget = 180;

  const handleSubmit = () => {
    const userAnswer = answer.replace(/\s/g, '');
    const correct = userAnswer === correctAnswer.replace(/\s/g, '');
    setIsCorrect(correct);
    setPoints(correct ? 200 : 0);
    setSubmitted(true);
  };

  const handleContinue = () => {
    setRoundCompleted('number', points, isCorrect);
    router.replace('/arena');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Number Rush</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.puzzleCard}>
          <Text style={styles.roundLabel}>Round 3 of 3</Text>
          <Text style={styles.puzzleTitle}>Solve the Number Puzzle</Text>
          
          <View style={styles.numberContainer}>
            <Text style={styles.numberText}>? + ? = {sumTarget}</Text>
            <Text style={styles.numberText}>? × ? = {productTarget}</Text>
          </View>

          <Text style={styles.hint}>Find two numbers that sum to {sumTarget} and multiply to {productTarget}</Text>

          {!submitted ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="e.g. 12,15"
                placeholderTextColor="#555"
                value={answer}
                onChangeText={setAnswer}
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
                <Text style={styles.resultSubtext}>+200 points earned!</Text>
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
  numberContainer: {
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  numberText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
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

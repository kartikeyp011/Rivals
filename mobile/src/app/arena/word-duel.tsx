import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { getArenaState, setRoundCompleted } from '../../state/arenaState';
import { supabase } from '../../lib/supabase';

export default function WordDuelScreen() {
  // #region agent log
  fetch('http://127.0.0.1:7833/ingest/af6d6571-6817-490e-94b4-07e56104faed',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'53e95e'},body:JSON.stringify({sessionId:'53e95e',location:'word-duel.tsx:mount',message:'WordDuelScreen rendered',data:{importPath:'../../state/arenaState'},timestamp:Date.now(),hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [points, setPoints] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // The correct answer for the puzzle
  const correctAnswer = 'STARE';
  const scrambled = 'E A R S T';

  const handleSubmit = () => {
    const userAnswer = answer.toUpperCase().trim();
    const correct = userAnswer === correctAnswer;
    setIsCorrect(correct);
    setPoints(correct ? 100 : 0);
    setShowFeedback(true);
    setSubmitted(true);
  };

  const handleContinue = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const state = getArenaState();
      if (!state.arenaId || !state.attemptId) {
        throw new Error('Arena session is invalid. Please restart the Arena.');
      }

      // 1. Fetch the correct puzzle for this round
      const { data: puzzleData, error: puzzleError } = await supabase
        .from('puzzles')
        .select('id')
        .eq('arena_id', state.arenaId)
        .eq('puzzle_type', 'word_duel')
        .single();

      console.log('[Word Duel] arenaId:', state.arenaId);
      console.log('[Word Duel] puzzleData:', puzzleData);
      console.log('[Word Duel] puzzleError:', JSON.stringify(puzzleError, null, 2));

      if (puzzleError || !puzzleData) {
        throw new Error('Failed to fetch puzzle information.');
      }

      // 2. Check for an existing result
      const { data: existingResult, error: checkError } = await supabase
        .from('arena_round_results')
        .select('id')
        .eq('attempt_id', state.attemptId)
        .eq('puzzle_id', puzzleData.id)
        .maybeSingle();

      if (checkError) {
        throw new Error('Failed to verify existing result.');
      }

      const resultData = {
        attempt_id: state.attemptId,
        puzzle_id: puzzleData.id,
        round_status: 'completed',
        points: points,
        is_correct: isCorrect,
        completed_at: new Date().toISOString()
      };

      if (existingResult) {
        const { error: updateError } = await supabase
          .from('arena_round_results')
          .update(resultData)
          .eq('id', existingResult.id);
        
        if (updateError) throw new Error('Failed to update result.');
      } else {
        const { error: insertError } = await supabase
          .from('arena_round_results')
          .insert(resultData);
        
        if (insertError) throw new Error('Failed to save result.');
      }

      setRoundCompleted('word', points, isCorrect);
      router.replace('/arena');
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
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
            <Text style={styles.scrambledText}>{scrambled}</Text>
          </View>

          <Text style={styles.hint}>Hint: It's a common 5-letter word meaning "to look fixedly"</Text>

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
                <Text style={styles.resultSubtext}>+100 points earned!</Text>
              ) : (
                <Text style={styles.resultSubtext}>The correct answer was: {correctAnswer}</Text>
              )}
              {saveError && (
                <Text style={styles.saveErrorText}>{saveError}</Text>
              )}
              <TouchableOpacity 
                style={[styles.continueButton, isSaving && styles.continueButtonDisabled]} 
                onPress={handleContinue}
                disabled={isSaving}
              >
                <Text style={styles.continueButtonText}>
                  {isSaving ? 'Saving...' : (saveError ? 'Retry →' : 'Continue →')}
                </Text>
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
  continueButtonDisabled: {
    backgroundColor: '#2a2a5a',
  },
  saveErrorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

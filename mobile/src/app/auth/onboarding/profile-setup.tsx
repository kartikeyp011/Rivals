import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';

const AVATARS = ['😊', '😎', '🤩', '🧠', '💪', '🦊', '🐉', '🚀', '🎯', '🏆'];

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('😊');

  const handleContinue = () => {
    // For now, just navigate to starting coins
    // Later this will save to Supabase
    router.push('/auth/onboarding/starting-coins');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set Up Your Profile</Text>
      <Text style={styles.subtitle}>Choose how you'll appear to friends</Text>

      <View style={styles.avatarSection}>
        <Text style={styles.label}>Your Avatar</Text>
        <View style={styles.avatarGrid}>
          {AVATARS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.avatarOption,
                selectedAvatar === emoji && styles.avatarSelected,
              ]}
              onPress={() => setSelectedAvatar(emoji)}
            >
              <Text style={styles.avatarEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.nameSection}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.hint}>This is how friends will see you</Text>
      </View>

      <TouchableOpacity 
        style={[styles.continueButton, !name && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={!name}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8888aa',
    marginBottom: 32,
  },
  avatarSection: {
    marginBottom: 24,
  },
  label: {
    color: '#ccccdd',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a3a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
    marginBottom: 8,
  },
  avatarSelected: {
    borderColor: '#6c5ce7',
    backgroundColor: '#2a2a5a',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  nameSection: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1a1a3a',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  hint: {
    color: '#555',
    fontSize: 12,
    marginTop: 6,
  },
  continueButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#2a2a5a',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Image, Switch } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const AVATARS = ['😊', '😎', '🤩', '🧠', '💪', '🦊', '🐉', '🚀', '🎯', '🏆'];

export default function ProfileSetupScreen() {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('😊');
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null);
  const [globalOptIn, setGlobalOptIn] = useState(false);
  const [loading, setLoading] = useState(true); // loading initial metadata
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata) {
          const metaAvatar = user.user_metadata.avatar_url || user.user_metadata.picture;
          if (metaAvatar) {
            setGoogleAvatar(metaAvatar);
            setSelectedAvatar(metaAvatar);
          }
        }
      } catch (err) {
        console.error('Failed to load user metadata', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetadata();
  }, []);

  const handleContinue = async () => {
    if (!username) {
      Alert.alert('Error', 'Please enter a username.');
      return;
    }

    // username format validation
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      Alert.alert('Invalid Username', 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.');
      return;
    }

    setSaving(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaving(false);
      Alert.alert('Error', 'Could not get authenticated user.');
      return;
    }

    // Attempt to upsert the profile. We use upsert with onConflict: 'id' to ensure 
    // we safely create the profile without duplicating, and handle the unique username constraint.
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: username,
        avatar_url: selectedAvatar,
        global_opt_in: globalOptIn,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    setSaving(false);

    if (upsertError) {
      if (upsertError.message.includes('unique constraint') || upsertError.code === '23505') {
        Alert.alert('Username taken', 'That username is already taken. Please choose another.');
      } else {
        Alert.alert('Error saving profile', upsertError.message);
      }
    } else {
      router.push('/auth/onboarding/starting-coins');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set Up Your Profile</Text>
      <Text style={styles.subtitle}>Choose how you'll appear to friends</Text>

      <View style={styles.avatarSection}>
        <Text style={styles.label}>Your Avatar</Text>
        <View style={styles.avatarGrid}>
          {googleAvatar && (
            <TouchableOpacity
              style={[
                styles.avatarOption,
                selectedAvatar === googleAvatar && styles.avatarSelected,
                { overflow: 'hidden' }
              ]}
              onPress={() => setSelectedAvatar(googleAvatar)}
            >
              <Image source={{ uri: googleAvatar }} style={{ width: 56, height: 56 }} />
            </TouchableOpacity>
          )}
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
        <Text style={styles.label}>Rivals Username</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. puzzle_master_99"
          placeholderTextColor="#555"
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>Must be unique. Letters, numbers, underscores only.</Text>
      </View>

      <View style={styles.privacySection}>
        <View style={styles.privacyRow}>
          <Text style={styles.privacyLabel}>Show me on the global leaderboard</Text>
          <Switch
            value={globalOptIn}
            onValueChange={setGlobalOptIn}
            trackColor={{ false: '#2a2a5a', true: '#6c5ce7' }}
            thumbColor={globalOptIn ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.hint}>If enabled, your username, avatar, score, and rank will be visible to everyone on the global leaderboard.</Text>
      </View>

      <TouchableOpacity 
        style={[styles.continueButton, (!username || saving) && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={!username || saving}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.continueButtonText}>Continue</Text>
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
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  privacySection: {
    marginBottom: 32,
    backgroundColor: '#1a1a3a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
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

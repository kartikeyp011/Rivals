import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppleAuth } from '../../hooks/useAppleAuth';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

export default function SignUpScreen() {
  const { signIn: signInApple, loading: loadingApple } = useAppleAuth();
  const { signIn: signInGoogle, loading: loadingGoogle } = useGoogleAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'rivals://auth/callback',
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else if (data.session) {
      router.push({ pathname: '/auth/onboarding/profile-setup', params: { initialName: name } });
    } else {
      Alert.alert('Check your email', 'Please confirm your email address to continue.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join Rivals and start competing!</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.signUpButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.socialButton}
          onPress={signInGoogle}
          disabled={loadingGoogle}
        >
          {loadingGoogle ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.socialText}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialButton}
          onPress={signInApple}
          disabled={loadingApple}
        >
          {loadingApple ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.socialText}>Continue with Apple</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signInLink}
          onPress={() => router.push('/auth/sign-in')}
        >
          <Text style={styles.signInLinkText}>
            Already have an account? <Text style={styles.signInLinkHighlight}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: '#8888aa',
    fontSize: 16,
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
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#ccccdd',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
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
  signUpButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a5a',
  },
  dividerText: {
    color: '#555',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    backgroundColor: '#1a1a3a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  socialText: {
    color: '#ffffff',
    fontSize: 16,
  },
  signInLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signInLinkText: {
    color: '#8888aa',
    fontSize: 14,
  },
  signInLinkHighlight: {
    color: '#6c5ce7',
    fontWeight: '600',
  },
});

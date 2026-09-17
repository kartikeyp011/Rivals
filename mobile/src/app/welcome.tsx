import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useAppleAuth } from '../hooks/useAppleAuth';

export default function WelcomeScreen() {
  const { signIn: signInGoogle, loading: loadingGoogle } = useGoogleAuth();
  const { signIn: signInApple, loading: loadingApple } = useAppleAuth();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>⚔️</Text>
        <Text style={styles.title}>Rivals</Text>
        <Text style={styles.subtitle}>Daily Puzzles & Wagers</Text>
        
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📝</Text>
            <Text style={styles.featureText}>Daily 3-Round Arena</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureText}>Compete with Friends</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🪙</Text>
            <Text style={styles.featureText}>Wager Virtual Coins</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🏆</Text>
            <Text style={styles.featureText}>Climb Leaderboards</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.googleButton}
          onPress={signInGoogle}
          disabled={loadingGoogle}
        >
          {loadingGoogle ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.appleButton}
          onPress={signInApple}
          disabled={loadingApple}
        >
          {loadingApple ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          )}
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
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8888aa',
    marginBottom: 40,
  },
  features: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a3a',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 30,
  },
  featureText: {
    color: '#ccccdd',
    fontSize: 16,
  },
  googleButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  appleButton: {
    backgroundColor: '#1a1a3a',
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  appleButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

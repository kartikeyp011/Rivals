import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';

export default function CallbackScreen() {
  const url = Linking.useURL();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (!url || handled.current) return;

    async function handleAuth() {
      handled.current = true;
      const parsed = Linking.parse(url as string);
      
      let params: Record<string, string> = {};
      if (parsed.queryParams) {
        params = { ...params, ...(parsed.queryParams as Record<string, string>) };
      }
      
      // Parse hash fragment manually if it exists (for Implicit flow)
      const hash = url?.split('#')[1];
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        hashParams.forEach((val, key) => {
          params[key] = val;
        });
      }

      const { code, access_token, refresh_token, error: urlError, error_description } = params;

      if (urlError) {
        setError(error_description || urlError);
        return;
      }

      let sessionError = null;

      if (code) {
        // PKCE Flow
        const { error: e } = await supabase.auth.exchangeCodeForSession(code);
        sessionError = e;
      } else if (access_token && refresh_token) {
        // Implicit Flow
        const { error: e } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        sessionError = e;
      } else {
        setError('No authentication token found in URL.');
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No user found after session establishment');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (profile?.display_name) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/onboarding/profile-setup');
      }
    }

    handleAuth();
  }, [url]);

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.errorText}>Error: {error}</Text>
      ) : (
        <>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.text}>Confirming your email...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: '#ffffff',
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  }
});

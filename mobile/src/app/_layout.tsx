import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// TODO: Replace with actual RevenueCat public API key for iOS when available
const RC_APPLE_API_KEY = "appl_placeholder_key";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: RC_APPLE_API_KEY });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
      if (session?.user?.id && Platform.OS === 'ios') {
        Purchases.logIn(session.user.id).catch(console.error);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN' && session?.user?.id) {
        if (Platform.OS === 'ios') {
          Purchases.logIn(session.user.id).catch(console.error);
        }
      } else if (_event === 'SIGNED_OUT') {
        if (Platform.OS === 'ios') {
          Purchases.logOut().catch(console.error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const segmentsArray = segments as string[];
    const inAuthGroup = segmentsArray[0] === 'auth';
    const isWelcome = segmentsArray.length === 1 && segmentsArray[0] === 'welcome';

    if (!session && !inAuthGroup && !isWelcome) {
      router.replace('/welcome' as any);
    } else if (session && isWelcome) {
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  if (!initialized) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="arena" />
      <Stack.Screen name="coins" />
      <Stack.Screen name="streak" />
      <Stack.Screen name="wagers" />
    </Stack>
  );
}
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
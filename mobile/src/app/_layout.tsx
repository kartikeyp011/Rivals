import 'react-native-get-random-values';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import * as Sentry from '@sentry/react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { AdVisibilityProvider } from '../hooks/useAdVisibility';
const analyticsModule = require('@react-native-firebase/analytics');
const analytics = analyticsModule.default || analyticsModule;

// Sentry initialization
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
});

// RevenueCat public API keys from environment variables
const RC_APPLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || '';
const RC_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '';

function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {

    if (Platform.OS === 'ios' && RC_APPLE_API_KEY) {
      Purchases.configure({ apiKey: RC_APPLE_API_KEY });
    } else if (Platform.OS === 'android' && RC_ANDROID_API_KEY) {
      Purchases.configure({ apiKey: RC_ANDROID_API_KEY });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
      if (session?.user?.id) {
        Purchases.logIn(session.user.id).catch(console.error);
        analytics().logEvent('login', { method: 'session_restore' }).catch(console.error);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN' && session?.user?.id) {
        Purchases.logIn(session.user.id).catch(console.error);
        analytics().logEvent('login', { method: 'auth_change' }).catch(console.error);
      } else if (_event === 'SIGNED_OUT') {
        Purchases.logOut().catch(console.error);
        analytics().logEvent('logout').catch(console.error);
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
    <AdVisibilityProvider>
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
    </AdVisibilityProvider>
  );
}

export default Sentry.wrap(RootLayout);
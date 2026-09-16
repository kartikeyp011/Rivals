import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

// Needs to be called at the top level
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // Create the OAuth session on Supabase
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'rivals://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (authError) {
        throw authError;
      }

      if (!data?.url) {
        throw new Error('No redirect URL returned from Supabase');
      }

      // Open the browser for auth
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'rivals://auth/callback'
      );

      // WebBrowser result type
      if (result.type === 'success') {
        // The deep link rivals://auth/callback is natively intercepted by Expo Router.
        // We do nothing here to prevent double-routing race conditions.
        console.log('Google login browser success. Awaiting deep link routing...');
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('User cancelled Google login.');
      } else {
        throw new Error(`Authentication failed: ${result.type}`);
      }
    } catch (e: any) {
      console.error('Google Auth Error:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
}

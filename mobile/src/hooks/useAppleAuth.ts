import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

// Must be called at module level to properly close ASWebAuthenticationSession on iOS
WebBrowser.maybeCompleteAuthSession();

export function useAppleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // Request the Supabase OAuth URL for Apple
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'rivals://auth/callback',
          // skipBrowserRedirect prevents Supabase JS from opening the browser;
          // we control it manually via WebBrowser.openAuthSessionAsync
          skipBrowserRedirect: true,
        },
      });

      if (authError) throw authError;
      if (!data?.url) throw new Error('No redirect URL returned from Supabase');

      // Open the Supabase Apple OAuth URL in an ASWebAuthenticationSession (iOS)
      // or Chrome Custom Tab (Android).
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'rivals://auth/callback'
      );

      if (result.type === 'success' && result.url) {
        console.log('Apple login browser success. Redirect URL:', result.url);
        
        // Extract query and hash parameters
        const parsed = Linking.parse(result.url);
        const queryParams: Record<string, string> = {};
        if (parsed.queryParams) {
          Object.entries(parsed.queryParams).forEach(([k, v]) => {
            if (typeof v === 'string') queryParams[k] = v;
          });
        }
        const hash = result.url.split('#')[1];
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          hashParams.forEach((val, key) => {
            queryParams[key] = val;
          });
        }

        router.push({
          pathname: '/auth/callback',
          params: queryParams,
        });
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // User closed the browser — not an error, button becomes pressable again
        console.log('User cancelled Apple login.');
      } else {
        throw new Error(`Apple authentication failed: ${result.type}`);
      }
    } catch (e: any) {
      console.error('Apple Auth Error:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
}

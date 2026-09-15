import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
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
      // or Chrome Custom Tab (Android). This is a browser-based OAuth flow —
      // not Apple's native Sign In with Apple sheet.
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'rivals://auth/callback'
      );

      if (result.type === 'success') {
        const resultUrl = new URL(result.url);
        // Supabase OAuth PKCE flow returns the code in the query string or hash
        const params = new URLSearchParams(
          resultUrl.search || resultUrl.hash.substring(1)
        );
        const code = params.get('code');
        if (code) {
          // Hand off to the unified PKCE callback handler (same as Google)
          router.replace(`/auth/callback?code=${encodeURIComponent(code)}`);
        }
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

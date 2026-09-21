import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
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

      if (result.type === 'success' && result.url) {
        console.log('Google login browser success. Redirect URL:', result.url);
        
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

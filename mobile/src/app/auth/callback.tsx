import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';

const withTimeout = <T,>(promise: PromiseLike<T> | Promise<T>, ms: number, desc: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: ${desc} took longer than ${ms}ms`));
    }, ms);
    Promise.resolve(promise)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export default function CallbackScreen() {
  // Use expo-router params as authoritative source, but also check Linking.useURL()
  const params = useLocalSearchParams();
  const url = Linking.useURL();
  
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Authenticating...');
  const [logs, setLogs] = useState<string[]>([]);
  
  // Guard against processing the same event twice
  const processedRef = useRef<string | null>(null);

  const addLog = (msg: string) => {
    console.log(`[Callback] ${msg}`);
    setLogs((prev) => [...prev, msg]);
  };

  useEffect(() => {
    async function handleAuth() {
      // Determine the authoritative params
      let finalParams: Record<string, string> = {};
      
      // 1. First, check Expo Router params
      if (params.code || params.access_token || params.error) {
        Object.assign(finalParams, params);
      } 
      // 2. Fallback to parsing raw URL if router params are empty
      else if (url) {
        const parsed = Linking.parse(url as string);
        if (parsed.queryParams) {
          Object.assign(finalParams, parsed.queryParams);
        }
        const hash = url?.split('#')[1];
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          hashParams.forEach((val, key) => {
            finalParams[key] = val;
          });
        }
      } else {
        // No parameters available yet
        return;
      }

      const { code, access_token, refresh_token, error: urlError, error_description } = finalParams;

      // Unique identifier for this callback event to prevent duplicate execution
      const eventId = code || access_token || urlError || 'unknown';
      if (!eventId || eventId === 'unknown') {
        return;
      }

      if (processedRef.current === eventId) {
        addLog('Duplicate callback event ignored.');
        return;
      }
      processedRef.current = eventId;

      try {
        addLog('1. Callback parameters received');
        
        if (urlError) {
          addLog(`Error in URL parameters: ${error_description || urlError}`);
          setError(error_description || urlError as string);
          return;
        }

        let sessionError = null;

        if (code) {
          addLog('2. Code detected (PKCE flow)');
          setStatusText('Signing you in...');
          addLog('3. Starting exchangeCodeForSession');
          
          const result = await withTimeout(
            supabase.auth.exchangeCodeForSession(code as string),
            15000,
            'exchangeCodeForSession'
          );
          
          addLog('4. exchangeCodeForSession completed');
          sessionError = result.error;
          if (!result.error && !result.data?.session) {
             addLog('WARNING: Session is null but error is also null.');
          }
        } else if (access_token && refresh_token) {
          addLog('2. Access token detected (Implicit flow)');
          setStatusText('Confirming your email...');
          addLog('3. Starting setSession');
          
          const result = await withTimeout(
            supabase.auth.setSession({ 
              access_token: access_token as string, 
              refresh_token: refresh_token as string 
            }),
            15000,
            'setSession'
          );
          
          addLog('4. setSession completed');
          sessionError = result.error;
        }

        if (sessionError) {
          addLog(`Session Error: ${sessionError.message}`);
          setError(sessionError.message);
          return;
        }

        addLog('5. Checking if session exists...');
        const { data: sessionData } = await supabase.auth.getSession();
        addLog(`Session check: ${sessionData.session ? 'EXISTS' : 'NULL'}`);
        if (!sessionData.session) {
           setError('Failed to establish session (silent failure).');
           return;
        }

        setStatusText('Getting user info...');
        addLog('6. Starting getUser');
        const { data: { user }, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          15000,
          'getUser'
        );
        addLog('7. getUser completed');

        if (userError) {
          addLog(`getUser Error: ${userError.message}`);
          setError(userError.message);
          return;
        }
        if (!user) {
          addLog('Error: No user found after session establishment');
          setError('No user found after session establishment');
          return;
        }

        setStatusText('Checking profile...');
        addLog('8. Starting profiles query');
        const { data: profiles, error: profileError } = await withTimeout(
          supabase.from('profiles').select('username').eq('id', user.id),
          15000,
          'profiles query'
        );
        addLog(`9. profiles query completed (error: ${profileError?.message || 'none'}, found: ${profiles?.length || 0})`);

        if (profileError) {
          addLog(`Profile Error: ${profileError.message}`);
          setError(profileError.message);
          return;
        }

        addLog('10. Navigation started');
        if (profiles && profiles.length > 0 && profiles[0].username) {
          addLog('Routing to Home /(tabs)');
          router.replace('/(tabs)');
        } else {
          addLog('Routing to Onboarding /auth/onboarding/profile-setup');
          router.replace('/auth/onboarding/profile-setup');
        }

      } catch (e: any) {
        addLog(`EXCEPTION: ${e.message}`);
        setError(e.message);
      }
    }

    handleAuth();
  }, [url, params.code, params.access_token, params.error]);

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.logTitle}>Diagnostic Logs:</Text>
          {logs.map((log, i) => (
            <Text key={i} style={styles.logText}>{log}</Text>
          ))}
        </View>
      ) : (
        <>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.text}>{statusText}</Text>
          <View style={styles.logsContainer}>
            {logs.map((log, i) => (
              <Text key={i} style={styles.logText}>{log}</Text>
            ))}
          </View>
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
  errorContainer: {
    width: '100%',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  logTitle: {
    color: '#ccccdd',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logsContainer: {
    marginTop: 30,
    width: '100%',
    padding: 10,
    backgroundColor: '#1a1a3a',
    borderRadius: 8,
  },
  logText: {
    color: '#8888aa',
    fontSize: 12,
    marginBottom: 4,
  }
});

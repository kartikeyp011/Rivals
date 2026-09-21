import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';

// Polyfill WebCrypto for Supabase PKCE
const _global = globalThis as any;

if (typeof _global.crypto !== 'object') {
  _global.crypto = {};
}
if (typeof _global.crypto.subtle !== 'object') {
  _global.crypto.subtle = {};
}
if (typeof _global.crypto.subtle.digest !== 'function') {
  _global.crypto.subtle.digest = async (algorithm: any, data: Uint8Array | ArrayBuffer) => {
    return await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array(data));
  };
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env or .env.local file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
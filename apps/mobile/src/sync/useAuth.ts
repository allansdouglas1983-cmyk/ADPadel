import { useEffect, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { fullSync } from './syncEngine';

WebBrowser.maybeCompleteAuthSession();

/**
 * Supabase auth (email magic-link, Apple, Google). Auth is OPTIONAL — free users
 * never sign in and stay 100% on-device. On sign-in we kick a full sync so a
 * returning user's history merges across devices.
 */
export function useAuth() {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) void fullSync();
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const signInWithEmail = async (email: string) => {
    if (!supabase) return;
    setBusy(true);
    try {
      await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: Linking.createURL('/auth') } });
    } finally {
      setBusy(false);
    }
  };

  const signInWithApple = async () => {
    if (!supabase) return;
    setBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (credential.identityToken) {
        await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
      }
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) return;
    setBusy(true);
    try {
      const redirectTo = Linking.createURL('/auth');
      const { data } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success') {
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          if (code) await supabase.auth.exchangeCodeForSession(code);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  return { session, user: session?.user ?? null, busy, signInWithEmail, signInWithApple, signInWithGoogle, signOut };
}

import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BRAND } from '@padel/shared';
import { spacing } from '@padel/design-tokens';
import { Button, Card, ChevronRight, Screen, Settings, Sparkles, Text } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useAuth } from '@/sync/useAuth';
import { fullSync } from '@/sync/syncEngine';
import { useSettings } from '@/store/settingsStore';
import { requestNotificationPermission } from '@/notifications/notify';

/** Profile & settings: Season Wrapped, Pro, accessibility, and optional cloud
 * backup (sign-in). */
export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isPro } = useEntitlements();
  const { user, signInWithApple, signInWithGoogle, signOut } = useAuth();
  const { highContrast, notifications, voiceCallout, setHighContrast, setNotifications, setVoiceCallout } = useSettings();
  const [syncing, setSyncing] = useState(false);

  const syncNow = async () => {
    setSyncing(true);
    try {
      await fullSync();
    } finally {
      setSyncing(false);
    }
  };

  const LinkRow = ({ label, onPress, tone = 'hi', icon }: { label: string; onPress: () => void; tone?: 'hi' | 'gold'; icon?: React.ReactNode }) => (
    <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} glowColor={tone === 'gold' ? 'gold' : 'none'}>
      <View
        accessibilityRole="button"
        onTouchEnd={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          {icon}
          <Text variant="bodyStrong" tone={tone}>
            {label}
          </Text>
        </View>
        <ChevronRight size={20} color={tone === 'gold' ? theme.gold : theme.textLo} />
      </View>
    </Card>
  );

  const ToggleRow = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="body" tone="hi">
        {label}
      </Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.brand }} />
    </Card>
  );

  return (
    <Screen scroll>
      <View style={{ gap: spacing.xs }}>
        <Text variant="title" tone="hi">
          {user?.email ?? t('score.you')}
        </Text>
        <Text variant="body" tone={isPro ? 'gold' : 'mid'}>
          {isPro ? 'Marque Pro' : 'Free'}
        </Text>
      </View>

      <LinkRow label="Season Wrapped" icon={<Sparkles size={20} color={theme.brand} />} onPress={() => router.push('/wrapped')} />
      {!isPro && <LinkRow label={t('paywall.title')} tone="gold" icon={<Sparkles size={20} color={theme.gold} />} onPress={() => router.push('/paywall')} />}

      <Text variant="label" tone="lo" style={{ marginTop: spacing.md }}>
        Accessibility & alerts
      </Text>
      <ToggleRow label="High-contrast on-court mode" value={highContrast} onChange={setHighContrast} />
      <ToggleRow label="Speak the score (voice call-out)" value={voiceCallout} onChange={setVoiceCallout} />
      <ToggleRow
        label="Notifications"
        value={notifications}
        onChange={(v) => {
          setNotifications(v);
          if (v) void requestNotificationPermission();
        }}
      />

      <Text variant="label" tone="lo" style={{ marginTop: spacing.md }}>
        Backup & multi-device
      </Text>
      {user ? (
        <>
          <Button label={syncing ? 'Syncing…' : 'Sync now'} full variant="secondary" onPress={syncNow} icon={<Settings size={18} color={theme.textHi} />} />
          <Button label="Sign out" full variant="ghost" onPress={signOut} />
        </>
      ) : (
        <>
          <Text variant="caption" tone="lo">
            Free to score offline forever. Sign in only to back up and sync across devices.
          </Text>
          <Button label="Continue with Apple" full variant="secondary" onPress={signInWithApple} />
          <Button label="Continue with Google" full variant="ghost" onPress={signInWithGoogle} />
        </>
      )}

      <Text variant="caption" tone="lo" style={{ marginTop: spacing.xl, textAlign: 'center' }}>
        {BRAND.storeTitle}
      </Text>
    </Screen>
  );
}

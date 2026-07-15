import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BRAND } from '@padel/shared';
import { spacing } from '@padel/design-tokens';
import { Button, Card, Screen, Text, ChevronRight, Crown, PadelBall, Play as PlayIcon, Sparkles, Users } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useResumable } from '@/hooks/useResumable';
import { getSetting } from '@/db/settingsRepo';

/** The Play tab — the app's home. Start a match or an event in one tap. */
export default function PlayScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const resumable = useResumable();

  // First-run: send new users through onboarding once. Declarative <Redirect>
  // waits for the navigator to be ready (an imperative router.replace here fires
  // before the Root Layout mounts and crashes the app at launch).
  const [onboarded] = useState(() => getSetting('onboarded', 'false') === 'true');
  if (!onboarded) return <Redirect href="/onboarding" />;

  const events: Array<{ label: string; icon: React.ReactNode; to: string }> = [
    { label: t('play.americano'), icon: <PadelBall size={20} color={theme.textMid} />, to: '/event/setup?format=americano' },
    { label: t('play.mexicano'), icon: <PadelBall size={20} color={theme.textMid} />, to: '/event/setup?format=mexicano' },
    { label: t('play.teamAmericano'), icon: <Users size={20} color={theme.textMid} />, to: '/event/setup?format=teamAmericano' },
    { label: t('play.mixedAmericano'), icon: <Users size={20} color={theme.textMid} />, to: '/event/setup?format=mixedAmericano' },
    { label: t('play.kingOfCourt'), icon: <Crown size={20} color={theme.textMid} />, to: '/king/setup' },
  ];

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(500)} style={{ gap: spacing.xs, marginBottom: spacing.md }}>
        <Text variant="display" tone="hi">
          {BRAND.wordmark}
        </Text>
        <Text variant="body" tone="mid">
          {BRAND.tagline}
        </Text>
      </Animated.View>

      {resumable && (
        <Animated.View entering={FadeInDown.delay(80)}>
          <Pressable onPress={resumable.resume} accessibilityRole="button" accessibilityLabel={resumable.label}>
            <Card glowColor="gold" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Sparkles size={22} color={theme.gold} />
                <Text variant="bodyStrong" tone="gold">
                  {resumable.label}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.gold} />
            </Card>
          </Pressable>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(140)}>
        <Button
          label={t('play.newMatch')}
          size="lg"
          full
          icon={<PlayIcon size={20} color="#04150E" />}
          onPress={() => router.push('/setup')}
        />
      </Animated.View>

      <Text variant="label" tone="lo" style={{ marginTop: spacing.md }}>
        Social formats
      </Text>
      {events.map((e, i) => (
        <Animated.View key={e.label} entering={FadeInDown.delay(200 + i * 60)}>
          <Pressable onPress={() => router.push(e.to)} accessibilityRole="button" accessibilityLabel={e.label}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                {e.icon}
                <Text variant="bodyStrong" tone="hi">
                  {e.label}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.textLo} />
            </Card>
          </Pressable>
        </Animated.View>
      ))}
    </Screen>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BRAND } from '@padel/shared';
import { spacing } from '@padel/design-tokens';
import { Card, ChevronRight, PadelBall, Screen, Text } from '@/ui';
import { matchPlayers } from '@/db/claimRepo';
import { useTheme } from '@/theme/ThemeProvider';

/** The landing page a shared card's QR/link opens (`/m/<matchId>`). Lists the
 * players and lets each claim their profile — the entry point of the viral loop. */
export default function MatchLandingScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const theme = useTheme();
  const people = useMemo(() => matchPlayers(matchId!), [matchId]);

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xxl }}>
        <PadelBall size={56} color={theme.brand} />
        <Text variant="display" tone="hi">
          {BRAND.wordmark}
        </Text>
        <Text variant="body" tone="mid" style={{ textAlign: 'center' }}>
          Claim your profile to keep your stats and history.
        </Text>
      </Animated.View>

      {people.map((p, i) => (
        <Animated.View key={p.id} entering={FadeInDown.delay(120 + i * 70)}>
          <Card
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            glowColor={p.claimed ? 'none' : 'brand'}
          >
            <View
              accessibilityRole="button"
              onTouchEnd={() => !p.claimed && router.push(`/claim/${p.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}
            >
              <Text variant="bodyStrong" tone="hi">
                {p.displayName}
              </Text>
              {p.claimed ? (
                <Text variant="label" tone="lo">
                  Claimed
                </Text>
              ) : (
                <ChevronRight size={20} color={theme.brand} />
              )}
            </View>
          </Card>
        </Animated.View>
      ))}

      {people.length === 0 && (
        <Text variant="body" tone="mid" style={{ textAlign: 'center' }}>
          This match isn’t on your device — install {BRAND.name} to claim your profile.
        </Text>
      )}
    </Screen>
  );
}

import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BRAND } from '@padel/shared';
import { spacing } from '@padel/design-tokens';
import { Button, CourtGlass, PadelBall, Screen, Sparkles, Text } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { setSetting } from '@/db/settingsRepo';

/**
 * First-run onboarding — three warm, animated scenes (value prop → score free →
 * optional sign-in), then straight into a match. No forced account (§7.2).
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const [i, setI] = useState(0);

  const scenes = [
    { icon: <PadelBall size={72} color={theme.brand} />, title: `Welcome to ${BRAND.name}`, body: 'The scoreboard, stats and Wrapped for padel — free to score, beautiful to share.' },
    { icon: <CourtGlass size={72} color={theme.accent} />, title: 'Never lose a match', body: 'Score on court with one tap. Every point is saved instantly — a crash or dead battery never loses your match.' },
    { icon: <Sparkles size={72} color={theme.gold} />, title: 'Share the bragging rights', body: 'Beautiful match cards, partner chemistry, ratings and a Season Wrapped. Sign in later to back it all up.' },
  ];
  const scene = scenes[i]!;
  const last = i === scenes.length - 1;

  const finish = () => {
    setSetting('onboarded', 'true');
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl }}>
        <Animated.View key={i} entering={FadeIn.duration(400)} exiting={FadeOut.duration(150)} style={{ alignItems: 'center', gap: spacing.lg }}>
          {scene.icon}
          <Text variant="display" tone="hi" style={{ textAlign: 'center' }}>
            {scene.title}
          </Text>
          <Text variant="body" tone="mid" style={{ textAlign: 'center', maxWidth: width * 0.8 }}>
            {scene.body}
          </Text>
        </Animated.View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing.xl }}>
        {scenes.map((_, idx) => (
          <View
            key={idx}
            style={{ width: idx === i ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: idx === i ? theme.brand : theme.border }}
          />
        ))}
      </View>

      <Button label={last ? 'Start scoring' : 'Next'} size="lg" full onPress={() => (last ? finish() : setI(i + 1))} />
      {!last && (
        <Text variant="label" tone="lo" onPress={finish} style={{ textAlign: 'center', marginTop: spacing.md }}>
          Skip
        </Text>
      )}
    </Screen>
  );
}

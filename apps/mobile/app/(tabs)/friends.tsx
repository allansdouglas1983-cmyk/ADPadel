import { router } from 'expo-router';
import { EmptyState, Screen, Users } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';

/** Friends & guests. The claim-your-profile invite loop lives here (§3.4). */
export default function FriendsScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <EmptyState
        icon={<Users size={64} color={theme.textLo} />}
        title="Your padel circle"
        body="Add partners and opponents as you play. When you share a match card they can claim their profile and inherit their stats in a few taps."
        actionLabel="Start a match"
        onAction={() => router.push('/setup')}
      />
    </Screen>
  );
}

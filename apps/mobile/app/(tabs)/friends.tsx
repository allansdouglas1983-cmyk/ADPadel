import { StyleSheet, Text, View } from 'react-native';
import { fontSize, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';

/** Friends & guests. The claim-your-profile invite loop lives here (§3.4). */
export default function FriendsScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.textHi }]}>Friends</Text>
      <Text style={{ color: theme.textMid }}>
        Add partners and opponents as guests. When you share a match card they can claim their
        profile and inherit their history in a few taps.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: '700' },
});

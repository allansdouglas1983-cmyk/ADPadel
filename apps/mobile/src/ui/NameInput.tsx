import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { fontFamily, fontSize, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';

/** A themed text input used across all setup flows — consistent styling, premium
 * surface, and the body font. */
export function NameInput(props: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      {...props}
      placeholderTextColor={theme.textLo}
      style={[styles.input, { color: theme.textHi, borderColor: theme.border, backgroundColor: theme.surface }, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radii.control,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.base,
    fontFamily: fontFamily.body,
  },
});

import type { ReactNode } from 'react';
import { View } from 'react-native';
import { spacing } from '@padel/design-tokens';
import { Text } from './Text';
import { Button } from './Button';

/** A premium empty state — an icon, a warm line, and a clear next action. Used
 * on History / Stats / Friends before there's data, so the app never feels bare. */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl }}>
      <View style={{ opacity: 0.9 }}>{icon}</View>
      <Text variant="title" tone="hi" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text variant="body" tone="mid" style={{ textAlign: 'center' }}>
        {body}
      </Text>
      {actionLabel && onAction && <Button label={actionLabel} onPress={onAction} style={{ marginTop: spacing.sm }} />}
    </View>
  );
}

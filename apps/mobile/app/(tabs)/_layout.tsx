import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textLo,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.play') }} />
      <Tabs.Screen name="history" options={{ title: t('tabs.history') }} />
      <Tabs.Screen name="stats" options={{ title: t('tabs.stats') }} />
      <Tabs.Screen name="friends" options={{ title: t('tabs.friends') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}

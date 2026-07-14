import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarChart3, History, PadelBall, User, Users } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = (focused: boolean) => (focused ? theme.brand : theme.textLo);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textLo,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        tabBarLabelStyle: { fontFamily: 'Inter-Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.play'), tabBarIcon: ({ focused }) => <PadelBall size={22} color={color(focused)} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t('tabs.history'), tabBarIcon: ({ focused }) => <History size={22} color={color(focused)} /> }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: t('tabs.stats'), tabBarIcon: ({ focused }) => <BarChart3 size={22} color={color(focused)} /> }}
      />
      <Tabs.Screen
        name="friends"
        options={{ title: t('tabs.friends'), tabBarIcon: ({ focused }) => <Users size={22} color={color(focused)} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: ({ focused }) => <User size={22} color={color(focused)} /> }}
      />
    </Tabs>
  );
}

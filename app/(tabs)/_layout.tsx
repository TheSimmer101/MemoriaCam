import { Tabs } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Text } from "react-native";

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{icon}</Text>
  );
}

export default function TabsLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#09090b" : "#ffffff",
          borderTopColor: isDark ? "#27272a" : "#e4e4e7",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: isDark ? "#ffffff" : "#000000",
        tabBarInactiveTintColor: isDark ? "#71717a" : "#a1a1aa",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⊞" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="recordings"
        options={{
          title: "My Recordings",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🎥" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📅" focused={focused} />
          ),
        }}
      />

    </Tabs>
  );
}
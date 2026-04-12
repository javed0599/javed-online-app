import { View, Pressable, Text, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

interface TabItem {
  name: string;
  label: string;
  icon: string;
  route: string;
}

const TABS: TabItem[] = [
  { name: "home", label: "Home", icon: "home", route: "/" },
  { name: "reminders", label: "Reminders", icon: "event-note", route: "/exam-reminders" },
  { name: "notifications", label: "Notifications", icon: "notifications", route: "/notification-history" },
  { name: "settings", label: "Settings", icon: "settings", route: "/settings" },
];

export function WebTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useColors();

  // Determine active tab based on current pathname
  const getActiveTab = (): string => {
    if (pathname === "/" || pathname === "") return "home";
    if (pathname.includes("exam-reminders")) return "reminders";
    if (pathname.includes("notification-history")) return "notifications";
    if (pathname.includes("settings")) return "settings";
    return "home";
  };

  const activeTab = getActiveTab();

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: "row",
        height: 60,
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        borderTopWidth: 0.5,
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: 8,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <Pressable
            key={tab.name}
            onPress={() => router.push(tab.route as any)}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 8,
            }}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={24}
              color={isActive ? colors.tint : colors.muted}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                marginTop: 4,
                color: isActive ? colors.tint : colors.muted,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

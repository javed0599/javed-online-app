import React, { useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ResultCard } from "@/components/result-card";
import { WebTabBar } from "@/components/web-tab-bar";

import { useData } from "@/lib/data-provider";
import { checkAllEntries } from "@/lib/check-all-service";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
  const router = useRouter();
  const { entries, deleteEntry, isLoading } = useData();
  const colors = useColors();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = (id: string, passportNumber: string) => {
    Alert.alert(
      "Delete Entry",
      `Are you sure you want to delete the entry for ${passportNumber}?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            await deleteEntry(id);
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleUpdate = (id: string) => {
    router.push({
      pathname: "/result-detail",
      params: { entryId: id, action: "update" },
    });
  };

  const handleCardPress = (id: string) => {
    router.push({
      pathname: "/result-detail",
      params: { entryId: id },
    });
  };

  const handleAddNew = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/search");
  };

  const handleCheckAll = async () => {
    if (entries.length === 0) return;
    await checkAllEntries(entries);
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <MaterialIcons name="hourglass-empty" size={48} color={colors.primary} />
        <Text style={{ color: colors.foreground, marginTop: 12 }}>
          Loading...
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenContainer
        className="flex-1"
        containerClassName="bg-background"
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: colors.foreground,
              }}
            >
              Labor Results
            </Text>
            <Pressable
              onPress={handleAddNew}
              style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
            >
              <MaterialIcons name="add-circle" size={40} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Content */}
        {entries.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            <MaterialIcons
              name="inbox"
              size={64}
              color={colors.muted}
              style={{ marginBottom: 16 }}
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              No Entries Yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                textAlign: "center",
              }}
            >
              Add your first passport entry to check labor results
            </Text>
          </View>
        ) : (
          <FlatList
            data={[...entries].reverse()}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={null}
            renderItem={({ item }) => (
            <ResultCard
              result={item.latest_result || ({} as any)}
              passportNumber={item.passport_number}
              applicantName={item.applicant_name}
              occupationCode={item.occupation_key}
              occupationName={item.occupation_name}
              entryId={item.id}
              onPress={() => handleCardPress(item.id)}
              onDelete={() => handleDelete(item.id, item.passport_number)}
              onUpdate={() => handleUpdate(item.id)}
            />
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            scrollEnabled
          />
        )}
        </View>
      </ScreenContainer>
      <WebTabBar />
    </View>
  );
}

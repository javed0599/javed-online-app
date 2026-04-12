import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/data-provider";
import { fetchLaborResult } from "@/lib/api";
import { PassportEntry } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { validationService } from "@/lib/validation-service";
import { getOccupationName } from "@/lib/occupations-service";

export default function SearchScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addEntry } = useData();

  const [passportNumber, setPassportNumber] = useState("");
  const [occupationCode, setOccupationCode] = useState("");
  const [nationalityCode, setNationalityCode] = useState("BGD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    // Validate all fields
    const validation = validationService.validateAllFields(
      passportNumber,
      occupationCode,
      nationalityCode
    );

    if (!validation.isValid) {
      Alert.alert("Invalid Input", validation.error || "Please check your input");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await fetchLaborResult({
        passport_number: passportNumber,
        occupation_key: occupationCode,
        nationality_id: nationalityCode,
        locale: "en",
      });

      if (result) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );

        // Fetch occupation name from API
        const occupationName = await getOccupationName(occupationCode);

        const newEntry: PassportEntry = {
          id: Date.now().toString(),
          passport_number: passportNumber,
          applicant_name: result.applicant_name,
          occupation_key: occupationCode,
          occupation_name: occupationName,
          nationality_id: nationalityCode,
          latest_result: result,
          check_history: [
            {
              id: Date.now().toString(),
              timestamp: Date.now(),
              result,
              status: result.exam_result,
            },
          ],
          referral_notes: [],
          created_at: Date.now(),
          last_checked_at: Date.now(),
          check_count: 1,
        };

        await addEntry(newEntry);
        router.back();
      }
    } catch (err) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch result";
      setError(errorMessage);
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colors.primary}
            />
          </Pressable>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: colors.foreground,
              marginLeft: 12,
              flex: 1,
            }}
          >
            Check Labor Result
          </Text>
        </View>

        {/* Form */}
        <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Passport Number */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              Passport Number
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 16,
                color: colors.foreground,
                backgroundColor: colors.surface,
              }}
              placeholder="e.g., A21082162"
              placeholderTextColor={colors.muted}
              value={passportNumber.toUpperCase()}
              onChangeText={(text) => setPassportNumber(text.toUpperCase())}
              editable={!loading}
            />
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {validationService.getHint("passport")}
            </Text>
          </View>

          {/* Occupation Code */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              Occupation Code
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 16,
                color: colors.foreground,
                backgroundColor: colors.surface,
              }}
              placeholder="e.g., 933301"
              placeholderTextColor={colors.muted}
              value={occupationCode}
              onChangeText={setOccupationCode}
              editable={!loading}
              keyboardType="number-pad"
            />
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {validationService.getHint("occupation")}
            </Text>
          </View>

          {/* Nationality Code */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              Nationality Code
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 16,
                color: colors.foreground,
                backgroundColor: colors.surface,
              }}
              placeholder="e.g., BGD"
              placeholderTextColor={colors.muted}
              value={nationalityCode.toUpperCase()}
              onChangeText={(text) => setNationalityCode(text.toUpperCase())}
              editable={!loading}
            />
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {validationService.getHint("nationality")}
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View
              style={{
                backgroundColor: colors.error,
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 14 }}>{error}</Text>
            </View>
          )}

          {/* Search Button */}
          <Pressable
            onPress={handleSearch}
            disabled={loading}
            style={({ pressed }) => [
              {
                backgroundColor: loading ? colors.muted : colors.primary,
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Check Result
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

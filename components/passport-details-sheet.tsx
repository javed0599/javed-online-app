import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";

interface PassportDetailsSheetProps {
  visible: boolean;
  onClose: () => void;
  passportNumber: string;
  occupationCode: string;
  nationalityCode: string;
  createdAt: number;
  lastCheckedAt?: number;
  checkCount?: number;
}

export function PassportDetailsSheet({
  visible,
  onClose,
  passportNumber,
  occupationCode,
  nationalityCode,
  createdAt,
  lastCheckedAt,
  checkCount = 0,
}: PassportDetailsSheetProps) {
  const colors = useColors();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getCountryName = (code: string): string => {
    const countries: Record<string, string> = {
      BGD: "Bangladesh",
      IND: "India",
      PAK: "Pakistan",
      PHL: "Philippines",
      EGY: "Egypt",
      SYR: "Syria",
      JOR: "Jordan",
      LBN: "Lebanon",
      YEM: "Yemen",
      OMN: "Oman",
      ARE: "United Arab Emirates",
      SAU: "Saudi Arabia",
      KWT: "Kuwait",
      QAT: "Qatar",
      BHR: "Bahrain",
      USA: "United States",
      GBR: "United Kingdom",
      CAN: "Canada",
      AUS: "Australia",
    };
    return countries[code] || code;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 16,
            maxHeight: "80%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: colors.foreground,
              }}
            >
              Passport Details
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Passport Number */}
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialIcons
                  name="badge"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.muted,
                  }}
                >
                  Passport Number
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.primary,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.foreground,
                    fontFamily: "monospace",
                  }}
                >
                  {passportNumber}
                </Text>
              </View>
            </View>

            {/* Occupation Code */}
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialIcons
                  name="work"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.muted,
                  }}
                >
                  Occupation Code
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.success,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.foreground,
                    fontFamily: "monospace",
                  }}
                >
                  {occupationCode}
                </Text>
              </View>
            </View>

            {/* Nationality */}
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialIcons
                  name="public"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.muted,
                  }}
                >
                  Nationality
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.warning,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.foreground,
                  }}
                >
                  {getCountryName(nationalityCode)}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                    marginTop: 4,
                    fontFamily: "monospace",
                  }}
                >
                  {nationalityCode}
                </Text>
              </View>
            </View>

            {/* Entry Created Date */}
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.muted,
                  }}
                >
                  Entry Created
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.primary,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.foreground,
                  }}
                >
                  {formatDate(createdAt)}
                </Text>
              </View>
            </View>

            {/* Last Checked */}
            {lastCheckedAt && (
              <View style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons
                    name="schedule"
                    size={20}
                    color={colors.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.muted,
                    }}
                  >
                    Last Checked
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.success,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.foreground,
                    }}
                  >
                    {formatDate(lastCheckedAt)}
                  </Text>
                </View>
              </View>
            )}

            {/* Check Count */}
            {checkCount > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={colors.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.muted,
                    }}
                  >
                    Total Checks
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.success,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.foreground,
                    }}
                  >
                    {checkCount} checks
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 20,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

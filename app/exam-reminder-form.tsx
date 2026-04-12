import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { ExamRemindersService } from "@/lib/exam-reminders-service";
import { OCRService } from "@/lib/ocr-service";
import { ExamReminder, OCRExtractedData } from "@/lib/types";


export default function ExamReminderFormScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    passport_no: "",
    nationality: "",
    ticket_no: "",
    occupation: "",
    test_center: "",
    test_date: "",
    test_time: "",
    language: "",
  });

  // Load extracted data if available
  useEffect(() => {
    if (params.extractedData) {
      try {
        const extracted = JSON.parse(params.extractedData as string) as OCRExtractedData;
        setFormData({
          name: extracted.name || "",
          passport_no: extracted.passport_no || "",
          nationality: extracted.nationality || "",
          ticket_no: extracted.ticket_no || "",
          occupation: extracted.occupation || "",
          test_center: extracted.test_center || "",
          test_date: extracted.test_date || "",
          test_time: extracted.test_time || "",
          language: extracted.language || "",
        });
      } catch (error) {
        console.error("Error parsing extracted data:", error);
      }
    }
  }, [params.extractedData]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        await processImage(uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleCameraCapture = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", "Camera permission is required");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        await processImage(uri);
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "Failed to capture image");
    }
  };

  const processImage = async (uri: string) => {
    try {
      setProcessingImage(true);
      const extractedData = await OCRService.extractFromImage(uri);
      
      if (extractedData) {
        setFormData((prev) => ({
          ...prev,
          name: extractedData.name || prev.name,
          passport_no: extractedData.passport_no || prev.passport_no,
          nationality: extractedData.nationality || prev.nationality,
          ticket_no: extractedData.ticket_no || prev.ticket_no,
          occupation: extractedData.occupation || prev.occupation,
          test_center: extractedData.test_center || prev.test_center,
          test_date: extractedData.test_date || prev.test_date,
          test_time: extractedData.test_time || prev.test_time,
          language: extractedData.language || prev.language,
        }));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Test ticket data extracted successfully");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert("Error", "Failed to extract data from image");
    } finally {
      setProcessingImage(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.passport_no.trim()) newErrors.passport_no = "Passport number is required";
    if (!formData.nationality.trim()) newErrors.nationality = "Nationality is required";
    if (!formData.ticket_no.trim()) newErrors.ticket_no = "Ticket number is required";
    if (!formData.occupation.trim()) newErrors.occupation = "Occupation is required";
    if (!formData.test_center.trim()) newErrors.test_center = "Test center is required";
    if (!formData.test_date.trim()) newErrors.test_date = "Test date is required";
    if (!formData.test_time.trim()) newErrors.test_time = "Test time is required";
    if (!formData.language.trim()) newErrors.language = "Language is required";

    // Validate date format (YYYY-MM-DD)
    if (formData.test_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.test_date)) {
      newErrors.test_date = "Date format should be YYYY-MM-DD";
    }

    // Validate time format (HH:MM AM/PM)
    if (formData.test_time && !/^\d{2}:\d{2}\s(AM|PM)$/.test(formData.test_time)) {
      newErrors.test_time = "Time format should be HH:MM AM/PM";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Validation Error", "Please fix the errors below");
      return;
    }

    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const reminder = await ExamRemindersService.createReminder({
        ...formData,
        image_uri: imageUri || (params.imageUri as string | undefined),
        extraction_confidence: imageUri || params.extractedData ? 75 : undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Reminder saved successfully", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error("Error saving reminder:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save reminder");
    } finally {
      setLoading(false);
    }
  };

  const FormField = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    multiline = false,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    error?: string;
    multiline?: boolean;
  }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.foreground,
          backgroundColor: colors.surface,
          fontSize: 14,
          minHeight: multiline ? 100 : 44,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        editable={!loading}
      />
      {error && (
        <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );

  return (
    <ScreenContainer className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
                Exam Reminder
              </Text>
              <Pressable
                onPress={() => router.back()}
                disabled={loading}
                style={({ pressed }) => [{ opacity: pressed || loading ? 0.6 : 1 }]}
              >
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Image Upload Section */}
            <View style={{ marginBottom: 20, gap: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                Upload Test Ticket (Optional)
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={handlePickImage}
                  disabled={processingImage || loading}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                      opacity: pressed || processingImage || loading ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialIcons name="image" size={20} color="white" />
                  <Text style={{ color: "white", fontWeight: "600", marginLeft: 8 }}>Gallery</Text>
                </Pressable>
                <Pressable
                  onPress={handleCameraCapture}
                  disabled={processingImage || loading}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                      opacity: pressed || processingImage || loading ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialIcons name="camera-alt" size={20} color="white" />
                  <Text style={{ color: "white", fontWeight: "600", marginLeft: 8 }}>Camera</Text>
                </Pressable>
              </View>
              {processingImage && (
                <View style={{ alignItems: "center", paddingVertical: 12 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ color: colors.muted, marginTop: 8 }}>Processing image...</Text>
                </View>
              )}
              {imageUri && (
                <View style={{ alignItems: "center", paddingVertical: 12 }}>
                  <Text style={{ color: colors.success, fontWeight: "600" }}>✓ Image uploaded successfully</Text>
                </View>
              )}
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              Manual Entry
            </Text>

            {/* Form Fields */}
            <FormField
              label="Applicant Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter full name"
              error={errors.name}
            />

            <FormField
              label="Passport Number"
              value={formData.passport_no}
              onChangeText={(text) => setFormData({ ...formData, passport_no: text })}
              placeholder="Enter passport number"
              error={errors.passport_no}
            />

            <FormField
              label="Nationality"
              value={formData.nationality}
              onChangeText={(text) => setFormData({ ...formData, nationality: text })}
              placeholder="Enter nationality"
              error={errors.nationality}
            />

            <FormField
              label="Ticket Number"
              value={formData.ticket_no}
              onChangeText={(text) => setFormData({ ...formData, ticket_no: text })}
              placeholder="Enter ticket number"
              error={errors.ticket_no}
            />

            <FormField
              label="Occupation"
              value={formData.occupation}
              onChangeText={(text) => setFormData({ ...formData, occupation: text })}
              placeholder="Enter occupation"
              error={errors.occupation}
            />

            <FormField
              label="Test Center"
              value={formData.test_center}
              onChangeText={(text) => setFormData({ ...formData, test_center: text })}
              placeholder="Enter test center"
              error={errors.test_center}
            />

            <FormField
              label="Test Date (YYYY-MM-DD)"
              value={formData.test_date}
              onChangeText={(text) => setFormData({ ...formData, test_date: text })}
              placeholder="2026-04-15"
              error={errors.test_date}
            />

            <FormField
              label="Test Time (HH:MM AM/PM)"
              value={formData.test_time}
              onChangeText={(text) => setFormData({ ...formData, test_time: text })}
              placeholder="01:00 PM"
              error={errors.test_time}
            />

            <FormField
              label="Language"
              value={formData.language}
              onChangeText={(text) => setFormData({ ...formData, language: text })}
              placeholder="e.g., Bengali, English"
              error={errors.language}
            />

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={loading}
              style={({ pressed }) => [
                {
                  marginTop: 24,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  opacity: pressed || loading ? 0.7 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="white" />
                  <Text style={{ color: "white", fontWeight: "600", marginLeft: 8 }}>Save Reminder</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

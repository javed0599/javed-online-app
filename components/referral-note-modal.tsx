import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface ReferralNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  title?: string;
}

export function ReferralNoteModal({
  visible,
  onClose,
  onSave,
  title = "Add Referral Note",
}: ReferralNoteModalProps) {
  const [note, setNote] = useState("");
  const colors = useColors();

  const handleSave = () => {
    if (note.trim()) {
      onSave(note);
      setNote("");
      onClose();
    }
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
      >
        <View
          style={[
            styles.content,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {title}
            </Text>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter your referral note..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={6}
            value={note}
            onChangeText={setNote}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.foreground }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={!note.trim()}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || !note.trim() ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: "#fff" }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 120,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#ccc",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

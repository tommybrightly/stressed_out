// src/components/OnboardingNotice.tsx
import React, { useEffect, useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { colors as theme } from "../theme/colors";
import { shadowCard } from "../theme/shadow";
import { loadPrefs, setHideOnboarding } from "../storage/prefs";

export default function OnboardingNotice() {
  const [visible, setVisible] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    (async () => {
      const prefs = await loadPrefs();
      setVisible(!prefs.hideOnboarding);
    })();
  }, []);

  const onClose = async () => {
    if (dontShow) await setHideOnboarding(true);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, shadowCard]}>
          <Text style={styles.title}>Welcome to Stress Less</Text>
          <Text style={styles.body}>
            • <Text style={styles.bold}>Chat</Text>: talk through your day — the app privately logs general mood (no cloud).{"\n"}
            • <Text style={styles.bold}>Drawing</Text>: sketch feelings; tap Save to keep.{"\n"}
            • <Text style={styles.bold}>Metrics</Text>: see a pie chart of recent emotions.
          </Text>

          <Pressable style={styles.checkboxRow} onPress={() => setDontShow(!dontShow)}>
            <View style={[styles.checkbox, dontShow && styles.checkboxChecked]}>
              {dontShow && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Don’t show this again</Text>
          </Pressable>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.primary]} onPress={onClose}>
              <Text style={styles.btnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: "700", color: theme.text, marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 22, color: theme.text },
  bold: { fontWeight: "700" },

  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.line,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: theme.primary, borderColor: theme.primary },
  checkMark: { color: "#fff", fontSize: 14, lineHeight: 14 },

  // ✅ Added style:
  checkboxLabel: { color: theme.text, fontSize: 16 },

  actions: { marginTop: 16, alignItems: "flex-end" },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  primary: { backgroundColor: theme.primary },
  btnText: { color: "#fff", fontWeight: "700" },
});

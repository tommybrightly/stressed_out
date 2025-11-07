import { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export default memo(function MoodPicker({ onPick }: { onPick: (v: number) => void }) {
  const values = [1,2,3,4,5,6,7,8,9,10];
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>How are you feeling today (1–10)?</Text>
      <View style={styles.row}>
        {values.map(v => (
          <Pressable key={v} onPress={() => onPick(v)} style={styles.chip}>
            <Text style={styles.chipText}>{v}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>1 = calm, 10 = overwhelmed</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8, paddingVertical: 6 },
  title: { fontWeight: "700", fontSize: 16 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#ccc", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  chipText: { fontSize: 14 },
  hint: { opacity: 0.6 }
});

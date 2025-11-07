import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";


export type StressTagValue = { stress: number; tags: string[] };


export default function StressTagInput({
onSave
}: {
onSave: (value: StressTagValue) => void;
}) {
const [stress, setStress] = useState(5);
const [tagText, setTagText] = useState("");


return (
<View style={styles.wrap}>
<Text style={styles.label}>Rate your current stress (1–10): {stress}</Text>
<View style={styles.sliderRow}>
<Button title="-" onPress={() => setStress(s => Math.max(1, s - 1))} />
<Button title="+" onPress={() => setStress(s => Math.min(10, s + 1))} />
</View>


<Text style={styles.label}>Add comma‑separated tags (e.g., work, traffic):</Text>
<TextInput
style={styles.input}
placeholder="work, email, commute"
value={tagText}
onChangeText={setTagText}
/>


<Button
title="Attach to last message & log"
onPress={() => {
const tags = tagText
.split(",")
.map(t => t.trim())
.filter(Boolean);
onSave({ stress, tags });
setTagText("");
}}
/>
</View>
);
}


const styles = StyleSheet.create({
wrap: { gap: 8 },
label: { fontSize: 14, fontWeight: "600" },
sliderRow: { flexDirection: "row", gap: 12 },
input: {
borderWidth: 1,
borderColor: "#DDD",
padding: 10,
borderRadius: 8
}
});
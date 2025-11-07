import { useRef, useState } from "react";
import { View, Button, PanResponder, StyleSheet, Text } from "react-native";
import Svg, { Path } from "react-native-svg";



// Simple freehand drawing using react-native-svg Paths.


type Stroke = { d: string };


export default function DrawingScreen() {
const [strokes, setStrokes] = useState<Stroke[]>([]);
const [current, setCurrent] = useState<string>("");
const [strokeWidth, setStrokeWidth] = useState(3);


const pan = useRef(
PanResponder.create({
onStartShouldSetPanResponder: () => true,
onPanResponderGrant: evt => {
const { locationX, locationY } = evt.nativeEvent;
const start = `M ${locationX} ${locationY}`;
setCurrent(start);
},
onPanResponderMove: evt => {
const { locationX, locationY } = evt.nativeEvent;
setCurrent(prev => (prev ? `${prev} L ${locationX} ${locationY}` : prev));
},
onPanResponderRelease: () => {
if (current) setStrokes(prev => [...prev, { d: current }]);
setCurrent("");
}
})
).current;


return (
<View style={{ flex: 1, padding: 12 }}>
<Text style={styles.title}>Doodle freely</Text>
<View style={styles.toolbar}>
<Button title="Clear" onPress={() => setStrokes([])} />
<Button title="Undo" onPress={() => setStrokes(prev => prev.slice(0, -1))} />
<Button title={`Width: ${strokeWidth}`} onPress={() => setStrokeWidth(w => (w % 12) + 1)} />
</View>


<View style={styles.canvas} {...pan.panHandlers}>
<Svg width="100%" height="100%">
{strokes.map((s, i) => (
<Path key={i} d={s.d} stroke="black" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
))}
{current ? (
<Path d={current} stroke="black" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
) : null}
</Svg>
</View>
</View>
);
}


const styles = StyleSheet.create({
title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
toolbar: { flexDirection: "row", gap: 12, marginBottom: 8 },
canvas: {
flex: 1,
borderWidth: 1,
borderColor: "#DDD",
borderRadius: 12,
overflow: "hidden",
backgroundColor: "#FFF"
}
});
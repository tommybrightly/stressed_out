// src/screens/DrawingScreen.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { PanGestureHandler, PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import Svg, { Path, Rect } from "react-native-svg";
import { GestureHandlerRootView } from "react-native-gesture-handler";

type Point = { x: number; y: number };
type Stroke = { color: string; width: number; points: Point[] };

const colors = ["#111", "#e11d48", "#0ea5e9", "#10b981", "#f59e0b"];

function toSvgPath(points: Point[]) {
  if (points.length === 0) return "";
  const d = ["M", points[0].x, points[0].y, ...points.slice(1).flatMap(p => ["L", p.x, p.y])];
  return d.join(" ");
}

export default function DrawingScreen() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [draft, setDraft] = useState<Stroke | null>(null);

  const [brushColor, setBrushColor] = useState("#111");
  const [brushWidth, setBrushWidth] = useState(4);

  const svgSize = useRef({ w: 0, h: 0 });

  const onLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    svgSize.current = { w: width, h: height };
  }, []);

  const startStroke = useCallback((x: number, y: number) => {
    setDraft({ color: brushColor, width: brushWidth, points: [{ x, y }] });
  }, [brushColor, brushWidth]);

  const appendPoint = useCallback((x: number, y: number) => {
    setDraft(prev =>
      prev ? { ...prev, points: [...prev.points, { x, y }] } : prev
    );
  }, []);

  const endStroke = useCallback(() => {
    setStrokes(prev => (draft && draft.points.length > 0 ? [...prev, draft] : prev));
    setDraft(null); // ← clear the temp stroke so it doesn’t “disappear”
  }, [draft]);

  // Gesture handlers
  const onGestureEvent = useCallback((e: PanGestureHandlerGestureEvent) => {
    const { x, y } = e.nativeEvent;
    appendPoint(x, y);
  }, [appendPoint]);

  const onHandlerStateChange = useCallback((e: PanGestureHandlerGestureEvent) => {
    const { state, x, y, numberOfPointers } = e.nativeEvent as any;
    // SIMPLE state mapping across platforms
    // 2 = BEGAN, 4 = ACTIVE, 5 = END, 3 = CANCELLED/FAIL
    if (state === 2) {
      startStroke(x, y);
    } else if (state === 5 || state === 3) {
      endStroke();
    }
  }, [startStroke, endStroke]);

  // Buttons
  const undo = () => setStrokes(prev => prev.slice(0, -1));
  const clear = () => {
    setDraft(null);
    setStrokes([]);
  };

  const draftPath = useMemo(() => (draft ? toSvgPath(draft.points) : ""), [draft]);

  return (
    <GestureHandlerRootView>
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.row}>
          {colors.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setBrushColor(c)}
              style={[styles.swatch, { backgroundColor: c, borderWidth: brushColor === c ? 2 : 0 }]}
            />
          ))}
        </View>
        <View style={styles.row}>
          {[2, 4, 8, 12].map(w => (
            <TouchableOpacity
              key={w}
              onPress={() => setBrushWidth(w)}
              style={[styles.widthBtn, brushWidth === w && styles.widthBtnActive]}
            >
              <View style={{ width: w * 2, height: w, backgroundColor: "#111", borderRadius: 999 }} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          <TouchableOpacity onPress={undo} style={styles.actionBtn}><Text>Undo</Text></TouchableOpacity>
          <TouchableOpacity onPress={clear} style={styles.actionBtn}><Text>Clear</Text></TouchableOpacity>
        </View>
      </View>

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        minDist={0} // start immediately on touch
      >
        <View style={styles.canvas} onLayout={onLayout}>
          <Svg style={StyleSheet.absoluteFill}>
            {/* Optional white background so saved PNGs are not transparent */}
            <Rect x={0} y={0} width="100%" height="100%" fill="#fff" />

            {strokes.map((s, idx) => (
              <Path
                key={idx}
                d={toSvgPath(s.points)}
                stroke={s.color}
                strokeWidth={s.width}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              />
            ))}

            {draft && (
              <Path
                d={draftPath}
                stroke={draft.color}
                strokeWidth={draft.width}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </Svg>
        </View>
      </PanGestureHandler>
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  toolbar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderColor: "#111" },
  widthBtn: {
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#cbd5e1", backgroundColor: "white"
  },
  widthBtnActive: { borderColor: "#111" },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: "#eee"
  },
  canvas: { flex: 1, backgroundColor: "#fff" },
});

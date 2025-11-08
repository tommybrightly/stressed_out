// src/screens/DrawingScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  Alert,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Svg, { Path, Rect } from "react-native-svg";
import ViewShot from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import type { SavedDrawing } from "../../src/storage/storage";
import { loadDrawings, saveDrawings } from "../../src/storage/storage";

type Point = { x: number; y: number };
type Stroke = { color: string; width: number; points: Point[] };

const colors = ["#111111", "#e11d48", "#0ea5e9", "#10b981", "#f59e0b"];
const widths = [2, 4, 8, 12];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function toSvgPath(points: Point[]) {
  if (!points.length) return "";
  const d = ["M", points[0].x, points[0].y, ...points.slice(1).flatMap(p => ["L", p.x, p.y])];
  return d.join(" ");
}

export default function DrawingScreen() {
  // drawing state
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [draft, setDraft] = useState<Stroke | null>(null);
  const [brushColor, setBrushColor] = useState(colors[0]);
  const [brushWidth, setBrushWidth] = useState(widths[1]);

  // gallery (persistent)
  const [saved, setSaved] = useState<SavedDrawing[]>([]);

  // ref for capturing the canvas
  const viewShotRef = useRef<ViewShot>(null);

  // load persisted gallery on mount
  useEffect(() => {
    (async () => {
      const existing = await loadDrawings();
      setSaved(existing);
    })();
  }, []);

  // start/extend/commit stroke
  const startStroke = useCallback(
    (x: number, y: number) => {
      setDraft({ color: brushColor, width: brushWidth, points: [{ x, y }] });
    },
    [brushColor, brushWidth]
  );

  const appendPoint = useCallback((x: number, y: number) => {
    setDraft(prev => (prev ? { ...prev, points: [...prev.points, { x, y }] } : prev));
  }, []);

  const endStroke = useCallback(() => {
    setStrokes(prev => (draft && draft.points.length ? [...prev, draft] : prev));
    setDraft(null);
  }, [draft]);

  // gestures
  const onGestureEvent = useCallback(
    (e: PanGestureHandlerGestureEvent) => {
      const { x, y } = e.nativeEvent;
      appendPoint(x, y);
    },
    [appendPoint]
  );

  const onHandlerStateChange = useCallback(
    (e: PanGestureHandlerGestureEvent) => {
      const { state, x, y } = e.nativeEvent as any;
      // 2 = BEGAN, 4 = ACTIVE, 5 = END, 3 = CANCELLED
      if (state === 2) startStroke(x, y);
      else if (state === 5 || state === 3) endStroke();
    },
    [startStroke, endStroke]
  );

  // actions
  const undo = () => setStrokes(prev => prev.slice(0, -1));
  const clear = () => {
    setDraft(null);
    setStrokes([]);
  };

  const save = async () => {
    try {
      // capture without args; options are on the ViewShot element
      const tmpUri = await viewShotRef.current?.capture?.();
      if (!tmpUri) throw new Error("Capture failed");

      // choose a writable base directory (TS-safe shim if types are older)
      const FS_ANY: any = FileSystem;
      const baseDir: string =
        (FS_ANY.documentDirectory as string | undefined) ??
        (FS_ANY.cacheDirectory as string | undefined) ??
        "";
      if (!baseDir) throw new Error("No writable directory available.");

      const dest = `${baseDir}${uid()}.png`;
      // copy (safer than move across boundaries)
      await FileSystem.copyAsync({ from: tmpUri, to: dest });

      const entry: SavedDrawing = { id: uid(), uri: dest, createdAt: Date.now() };
      const next = [entry, ...saved];
      setSaved(next);
      await saveDrawings(next);
    } catch (err: any) {
      Alert.alert("Save failed", String(err?.message || err));
    }
  };

  const deleteOne = async (item: SavedDrawing) => {
    Alert.alert("Delete drawing?", "This will remove the image from your device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // delete the file (ignore if it doesn't exist)
            try { await FileSystem.deleteAsync(item.uri, { idempotent: true }); } catch {}
            const next = saved.filter(x => x.id !== item.id);
            setSaved(next);
            await saveDrawings(next);
          } catch (err: any) {
            Alert.alert("Delete failed", String(err?.message || err));
          }
        },
      },
    ]);
  };

  const draftPath = useMemo(() => (draft ? toSvgPath(draft.points) : ""), [draft]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Canvas ~half of the screen */}
      <View style={styles.canvasBlock}>
        <ViewShot
          ref={viewShotRef}
          style={styles.canvasShot}
          options={{ format: "png", quality: 1, result: "tmpfile" }}
        >
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
            minDist={0}
          >
            <View style={styles.canvas}>
              <Svg style={StyleSheet.absoluteFill}>
                {/* solid background so saved PNGs aren't transparent */}
                <Rect x={0} y={0} width="100%" height="100%" fill="#ffffff" />
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
        </ViewShot>
      </View>

      {/* Controls */}
      <View style={styles.toolbar}>
        <View style={styles.row}>
          <Text style={styles.label}>Pen</Text>
          {colors.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setBrushColor(c)}
              style={[
                styles.swatch,
                { backgroundColor: c, borderWidth: brushColor === c ? 2 : 1 },
              ]}
            />
          ))}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Width</Text>
          {widths.map(w => (
            <TouchableOpacity
              key={w}
              onPress={() => setBrushWidth(w)}
              style={[styles.widthBtn, brushWidth === w && styles.widthBtnActive]}
            >
              <View
                style={{
                  width: w * 2,
                  height: w,
                  backgroundColor: brushColor,
                  borderRadius: 999,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.row, { justifyContent: "flex-end", marginBottom: 0 }]}>
          <TouchableOpacity onPress={undo} style={styles.actionBtn}>
            <Text style={styles.actionText}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clear} style={styles.actionBtn}>
            <Text style={styles.actionText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={save} style={[styles.actionBtn, styles.saveBtn]}>
            <Text style={[styles.actionText, { fontWeight: "700" }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gallery */}
      <View style={styles.galleryBlock}>
        <Text style={styles.galleryTitle}>Your drawings</Text>
        <FlatList
          data={saved}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12 }}
          numColumns={3}
          renderItem={({ item }) => (
            <View style={styles.thumbWrap}>
              <Image source={{ uri: item.uri }} style={styles.thumb} />
              {/* delete button overlay */}
              <TouchableOpacity
                onPress={() => deleteOne(item)}
                style={styles.deleteBadge}
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nothing saved yet. Tap “Save” to add your first doodle.
            </Text>
          }
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // ~half screen for canvas; gallery gets remaining space
  canvasBlock: { flex: 1.1, backgroundColor: "#e5e7eb" },
  canvasShot: { flex: 1 },
  canvas: { flex: 1, backgroundColor: "#ffffff" },

  toolbar: {
    backgroundColor: "white",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  label: { fontWeight: "600", marginRight: 6 },

  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderColor: "#111",
  },
  widthBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cbd5e1",
    backgroundColor: "white",
  },
  widthBtnActive: { borderColor: "#111" },

  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    marginLeft: 6,
  },
  saveBtn: { backgroundColor: "#dbeafe" },
  actionText: { color: "#111" },

  galleryBlock: { flex: 1, backgroundColor: "#f8fafc" },
  galleryTitle: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  thumbWrap: { width: "33.333%", aspectRatio: 1, padding: 6 },
  thumb: { flex: 1, borderRadius: 8, backgroundColor: "#fff" },

  deleteBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  deleteText: { color: "white", fontSize: 14, lineHeight: 16 },

  empty: { textAlign: "center", color: "#64748b", padding: 16 },
});

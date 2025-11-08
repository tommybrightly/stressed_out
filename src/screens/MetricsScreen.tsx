// src/screens/MetricsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { loadEmotionEvents, countsFrom } from "../storage/emotions";
import { EMOTION_CATEGORIES, EmotionCategory } from "../emotion/classifyEmotion";

// tweak colors any time
const COLORS: Record<EmotionCategory, string> = {
  calm: "#60a5fa",
  happy: "#fbbf24",
  sad: "#3b82f6",
  mad: "#ef4444",
  anxious: "#a78bfa",
  hopeless: "#6b7280",
  tired: "#f59e0b",
  stressed: "#fb7185",
  lonely: "#94a3b8",
  grief: "#4b5563",
};

type Slice = { cat: EmotionCategory; start: number; end: number; value: number; pct: number };

function buildPie(counts: Record<EmotionCategory, number>): Slice[] {
  const total = EMOTION_CATEGORIES.reduce((sum, c) => sum + (counts[c] || 0), 0);
  if (!total) return [];
  let acc = 0;
  const slices: Slice[] = [];
  for (const cat of EMOTION_CATEGORIES) {
    const v = counts[cat] || 0;
    if (v <= 0) continue;
    const angle = (v / total) * (Math.PI * 2);
    slices.push({ cat, start: acc, end: acc + angle, value: v, pct: v / total });
    acc += angle;
  }
  return slices;
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const x0 = cx + r * Math.cos(start);
  const y0 = cy + r * Math.sin(start);
  const x1 = cx + r * Math.cos(end);
  const y1 = cy + r * Math.sin(end);
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`;
}

export default function MetricsScreen() {
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");
  const [counts, setCounts] = useState<Record<EmotionCategory, number>>(
    Object.fromEntries(EMOTION_CATEGORIES.map((c) => [c, 0])) as any,
  );

  useEffect(() => {
    (async () => {
      const all = await loadEmotionEvents();
      const now = Date.now();
      const cutoff =
        range === "7d" ? now - 7 * 86400_000 : range === "30d" ? now - 30 * 86400_000 : 0;
      const filtered = cutoff ? all.filter((e) => e.at >= cutoff) : all;
      setCounts(countsFrom(filtered));
    })();
  }, [range]);

  const total = useMemo(
    () => EMOTION_CATEGORIES.reduce((sum, c) => sum + (counts[c] || 0), 0),
    [counts],
  );
  const slices = useMemo(() => buildPie(counts), [counts]);

  const size = 260;
  const R = 120;
  const CX = size / 2;
  const CY = size / 2;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.title}>Mood Metrics</Text>

      <View style={styles.rangeRow}>
        {(["7d", "30d", "all"] as const).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRange(r)}
            style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
          >
            <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>
              {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "All time"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        {total === 0 ? (
          <Text style={styles.empty}>No emotion data yet. Chat with the bot to log some!</Text>
        ) : (
          <View style={styles.chartRow}>
            <Svg width={size} height={size}>
              <G>
                {slices.map((s, i) => (
                  <Path
                    key={s.cat + i}
                    d={arcPath(CX, CY, R, s.start - Math.PI / 2, s.end - Math.PI / 2)}
                    fill={COLORS[s.cat]}
                  />
                ))}
              </G>
            </Svg>

            <View style={styles.legend}>
              <Text style={styles.total}>{total} entries</Text>
              {EMOTION_CATEGORIES.filter((c) => (counts[c] || 0) > 0).map((cat) => {
                const v = counts[cat] || 0;
                const pct = ((v / total) * 100).toFixed(0);
                return (
                  <View key={cat} style={styles.legendRow}>
                    <View style={[styles.legendSwatch, { backgroundColor: COLORS[cat] }]} />
                    <Text style={styles.legendLabel}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                    <Text style={styles.legendValue}>
                      {v} • {pct}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  title: { fontSize: 20, fontWeight: "700", padding: 16 },
  card: {
    marginHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  rangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cbd5e1",
    backgroundColor: "white",
  },
  rangeBtnActive: { borderColor: "#111" },
  rangeText: { color: "#334155" },
  rangeTextActive: { fontWeight: "700", color: "#0f172a" },

  chartRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  legend: { flex: 1 },
  total: { fontWeight: "700", marginBottom: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 3, marginRight: 8 },
  legendLabel: { flex: 1, color: "#0f172a" },
  legendValue: { color: "#475569" },

  empty: { textAlign: "center", color: "#64748b", padding: 16 },
});

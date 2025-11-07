// src/screens/MetricsScreen.tsx
import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Dimensions, StyleSheet } from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { loadStressEntries } from "../storage/storage"; 
import type { StressEntry } from "../types";             

export default function MetricsScreen() {
  const [entries, setEntries] = useState<StressEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await loadStressEntries();
        setEntries(Array.isArray(data) ? data : []);
      } catch {
        setEntries([]);
      }
    })();
  }, []);

  const width = Math.max(320, Dimensions.get("window").width - 24);

  const lineData = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
    return {
      labels: sorted.map(e => new Date(e.createdAt).toLocaleDateString()),
      datasets: [{ data: sorted.map(e => e.stress || 0) }],
    };
  }, [entries]);

  const tagAverages = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    entries.forEach(e => {
      const tags = e.tags?.length ? e.tags : ["(untagged)"];
      tags.forEach(tag => {
        const agg = map.get(tag) ?? { total: 0, count: 0 };
        agg.total += e.stress ?? 0;
        agg.count += 1;
        map.set(tag, agg);
      });
    });
    const pairs = [...map.entries()].map(([tag, { total, count }]) => ({
      tag,
      avg: count ? total / count : 0,
    }));
    pairs.sort((a, b) => b.avg - a.avg);
    return pairs.slice(0, 6);
  }, [entries]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
      <Text style={styles.title}>Your metrics</Text>

      <Text style={styles.section}>Stress over time</Text>
      {entries.length > 0 ? (
        <LineChart
          data={lineData}
          width={width}
          height={220}
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          }}
          bezier
          style={{ borderRadius: 8 }}
        />
      ) : (
        <Text style={styles.empty}>No data yet. Log stress from the Home tab.</Text>
      )}

      <Text style={styles.section}>Average stress by tag</Text>
      {tagAverages.length > 0 ? (
        <BarChart
        data={{
          labels: tagAverages.map(t => t.tag),
          datasets: [{ data: tagAverages.map(t => Number(t.avg.toFixed(2))) }],
        }}
        width={width}
        height={240}
        yAxisLabel=""           // <-- add
        yAxisSuffix=""          // <-- add
        fromZero
        showValuesOnTopOfBars
        chartConfig={{
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
        }}
        style={{ borderRadius: 8 }}
      />
      ) : (
        <Text style={styles.empty}>Tag your entries to see which stressors hit hardest.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  section: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  empty: { opacity: 0.6 },
});

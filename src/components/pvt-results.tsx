"use client";

import type { PvtTrial } from "@/lib/types";
import { PVT_MINOR_LAPSE_MS, PVT_MAJOR_LAPSE_MS } from "@/lib/constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

function mean(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

interface PvtResultsProps {
  trials: PvtTrial[];
}

export function PvtResults({ trials }: PvtResultsProps) {
  const valid = trials.filter((t) => !t.is_false_start);
  const fsCount = trials.filter((t) => t.is_false_start).length;
  const rts = valid
    .map((t) => t.reaction_time_ms)
    .filter((rt): rt is number => rt !== null);

  if (rts.length === 0) {
    return (
      <p className="text-[var(--yellow)]">有効な試行がありません。</p>
    );
  }

  const meanRt = mean(rts);
  const minor = rts.filter((r) => r > PVT_MINOR_LAPSE_MS).length;
  const major = rts.filter((r) => r > PVT_MAJOR_LAPSE_MS).length;
  const sortedDesc = [...rts].sort((a, b) => b - a);
  const nSlow = Math.max(1, Math.floor(sortedDesc.length / 10));
  const slowest10 = mean(sortedDesc.slice(0, nSlow));

  const chartData = valid.map((t, i) => ({
    trial: i + 1,
    rt: t.reaction_time_ms,
  }));

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Mean RT" value={`${meanRt.toFixed(0)} ms`} />
        <MetricCard label="Minor Lapse" value={String(minor)} />
        <MetricCard label="Major Lapse" value={String(major)} />
        <MetricCard label="False Start" value={String(fsCount)} />
      </div>
      <div className="mb-6">
        <MetricCard label="Slowest 10% 平均" value={`${slowest10.toFixed(0)} ms`} />
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="trial"
              label={{ value: "試行", position: "insideBottom", offset: -5, fill: "#888" }}
              stroke="#555"
            />
            <YAxis
              label={{ value: "RT (ms)", angle: -90, position: "insideLeft", fill: "#888" }}
              stroke="#555"
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
            />
            <ReferenceLine
              y={PVT_MINOR_LAPSE_MS}
              stroke="#ffd700"
              strokeDasharray="5 5"
              label={{ value: "Minor (355ms)", fill: "#ffd700", position: "right" }}
            />
            <ReferenceLine
              y={PVT_MAJOR_LAPSE_MS}
              stroke="#ff4b4b"
              strokeDasharray="5 5"
              label={{ value: "Major (500ms)", fill: "#ff4b4b", position: "right" }}
            />
            <Line
              type="monotone"
              dataKey="rt"
              stroke="#ff4b4b"
              dot={{ r: 3 }}
              name="RT (ms)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

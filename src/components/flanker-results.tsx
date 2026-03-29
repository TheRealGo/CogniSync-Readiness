"use client";

import type { FlankerTrial } from "@/lib/types";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function mean(arr: number[]) {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function pstdev(arr: number[]) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

interface FlankerResultsProps {
  trials: FlankerTrial[];
}

export function FlankerResults({ trials }: FlankerResultsProps) {
  const correct = trials.filter((t) => t.is_correct).length;
  const accuracy = trials.length > 0 ? (correct / trials.length) * 100 : 0;

  const congRts = trials
    .filter((t) => t.is_congruent && t.is_correct)
    .map((t) => t.reaction_time_ms);
  const incongRts = trials
    .filter((t) => !t.is_congruent && t.is_correct)
    .map((t) => t.reaction_time_ms);
  const allCorrectRts = trials
    .filter((t) => t.is_correct)
    .map((t) => t.reaction_time_ms);

  const meanCong = mean(congRts);
  const meanIncong = mean(incongRts);
  const interference = meanIncong - meanCong;
  const stdDev = pstdev(allCorrectRts);

  const congData = trials
    .filter((t) => t.is_congruent)
    .map((t) => ({ trial: t.trial_number, rt: t.reaction_time_ms }));
  const incongData = trials
    .filter((t) => !t.is_congruent)
    .map((t) => ({ trial: t.trial_number, rt: t.reaction_time_ms }));

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard label="正答率" value={`${accuracy.toFixed(1)}%`} />
        <MetricCard label="干渉効果" value={`${interference.toFixed(0)} ms`} />
        <MetricCard label="RT 標準偏差" value={`${stdDev.toFixed(0)} ms`} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetricCard label="一致試行 平均RT" value={`${meanCong.toFixed(0)} ms`} />
        <MetricCard label="不一致試行 平均RT" value={`${meanIncong.toFixed(0)} ms`} />
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="trial"
              type="number"
              label={{ value: "試行", position: "insideBottom", offset: -5, fill: "#888" }}
              stroke="#555"
            />
            <YAxis
              dataKey="rt"
              label={{ value: "RT (ms)", angle: -90, position: "insideLeft", fill: "#888" }}
              stroke="#555"
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
            />
            <Legend />
            <Scatter name="一致" data={congData} fill="#4b9dff" />
            <Scatter name="不一致" data={incongData} fill="#ff8c00" />
          </ScatterChart>
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

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Session, PvtTrial, FlankerTrial } from "@/lib/types";
import { PVT_MINOR_LAPSE_MS, PVT_MAJOR_LAPSE_MS } from "@/lib/constants";

function mean(arr: number[]) {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

type Tab = "pvt" | "flanker";

export default function ResultsPage() {
  const [tab, setTab] = useState<Tab>("pvt");

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">結果履歴</h1>
      <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
        <TabButton label="PVT" active={tab === "pvt"} onClick={() => setTab("pvt")} />
        <TabButton
          label="Flanker Task"
          active={tab === "flanker"}
          onClick={() => setTab("flanker")}
        />
      </div>
      {tab === "pvt" ? <PvtHistory /> : <FlankerHistory />}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition -mb-px cursor-pointer ${
        active
          ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
}

function PvtHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [trialsMap, setTrialsMap] = useState<Record<number, PvtTrial[]>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/sessions?task_type=pvt");
    const data: Session[] = await res.json();
    setSessions(data);

    const trMap: Record<number, PvtTrial[]> = {};
    await Promise.all(
      data.map(async (s) => {
        const tRes = await fetch(`/api/sessions/${s.id}/trials`);
        trMap[s.id] = await tRes.json();
      })
    );
    setTrialsMap(trMap);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleDeleteAll = async () => {
    await fetch("/api/sessions/delete-all?task_type=pvt", { method: "DELETE" });
    setConfirmDeleteAll(false);
    fetchData();
  };

  if (sessions.length === 0) {
    return <p className="text-[var(--muted-foreground)]">PVTの記録がありません。</p>;
  }

  const trendData = [...sessions]
    .reverse()
    .map((s) => {
      const trials = trialsMap[s.id] ?? [];
      const rts = trials
        .filter((t) => !t.is_false_start && t.reaction_time_ms !== null)
        .map((t) => t.reaction_time_ms!);
      if (rts.length === 0) return null;
      return {
        date: s.created_at.slice(0, 16),
        mean_rt: Math.round(mean(rts)),
        subjective: s.subjective_score,
      };
    })
    .filter(Boolean);

  return (
    <div>
      {trendData.length >= 2 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 mb-6">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#ff4b4b" label={{ value: "RT (ms)", angle: -90, position: "insideLeft", fill: "#888" }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 11]} stroke="#4b9dff" label={{ value: "主観スコア", angle: 90, position: "insideRight", fill: "#888" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="mean_rt" stroke="#ff4b4b" name="Mean RT (ms)" dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="subjective" stroke="#4b9dff" strokeDasharray="5 5" name="主観スコア" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map((s) => {
          const trials = trialsMap[s.id] ?? [];
          const rts = trials
            .filter((t) => !t.is_false_start && t.reaction_time_ms !== null)
            .map((t) => t.reaction_time_ms!);
          if (rts.length === 0) return null;
          const meanRt = mean(rts);
          const minor = rts.filter((r) => r > PVT_MINOR_LAPSE_MS).length;
          const major = rts.filter((r) => r > PVT_MAJOR_LAPSE_MS).length;
          const isOpen = expanded === s.id;

          return (
            <div key={s.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
              <button
                onClick={() => setExpanded(isOpen ? null : s.id)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--accent)] transition rounded-lg cursor-pointer"
              >
                {s.created_at.slice(0, 16)} | 主観: {s.subjective_score}/10 | Mean RT: {meanRt.toFixed(0)}ms
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <MiniMetric label="Mean RT" value={`${meanRt.toFixed(0)} ms`} />
                    <MiniMetric label="Minor Lapse" value={String(minor)} />
                    <MiniMetric label="Major Lapse" value={String(major)} />
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-sm text-[var(--destructive)] hover:underline cursor-pointer"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-4">
        {!confirmDeleteAll ? (
          <button
            onClick={() => setConfirmDeleteAll(true)}
            className="text-sm text-[var(--destructive)] hover:underline cursor-pointer"
          >
            全てのPVT記録を削除
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[var(--yellow)]">本当に全てのPVT記録を削除しますか？</p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAll}
                className="px-4 py-1 rounded bg-[var(--destructive)] text-white text-sm cursor-pointer"
              >
                はい、削除する
              </button>
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="px-4 py-1 rounded border border-[var(--border)] text-sm cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FlankerHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [trialsMap, setTrialsMap] = useState<Record<number, FlankerTrial[]>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/sessions?task_type=flanker");
    const data: Session[] = await res.json();
    setSessions(data);

    const trMap: Record<number, FlankerTrial[]> = {};
    await Promise.all(
      data.map(async (s) => {
        const tRes = await fetch(`/api/sessions/${s.id}/trials`);
        trMap[s.id] = await tRes.json();
      })
    );
    setTrialsMap(trMap);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleDeleteAll = async () => {
    await fetch("/api/sessions/delete-all?task_type=flanker", { method: "DELETE" });
    setConfirmDeleteAll(false);
    fetchData();
  };

  if (sessions.length === 0) {
    return <p className="text-[var(--muted-foreground)]">Flanker Taskの記録がありません。</p>;
  }

  const trendData = [...sessions]
    .reverse()
    .map((s) => {
      const trials = trialsMap[s.id] ?? [];
      if (trials.length === 0) return null;
      const cong = trials.filter((t) => t.is_congruent && t.is_correct).map((t) => t.reaction_time_ms);
      const incong = trials.filter((t) => !t.is_congruent && t.is_correct).map((t) => t.reaction_time_ms);
      const interference = cong.length > 0 && incong.length > 0 ? mean(incong) - mean(cong) : 0;
      return {
        date: s.created_at.slice(0, 16),
        interference: Math.round(interference),
        subjective: s.subjective_score,
      };
    })
    .filter(Boolean);

  return (
    <div>
      {trendData.length >= 2 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 mb-6">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#ff8c00" label={{ value: "干渉効果 (ms)", angle: -90, position: "insideLeft", fill: "#888" }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 11]} stroke="#4b9dff" label={{ value: "主観スコア", angle: 90, position: "insideRight", fill: "#888" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="interference" stroke="#ff8c00" name="干渉効果 (ms)" dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="subjective" stroke="#4b9dff" strokeDasharray="5 5" name="主観スコア" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map((s) => {
          const trials = trialsMap[s.id] ?? [];
          if (trials.length === 0) return null;
          const acc = (trials.filter((t) => t.is_correct).length / trials.length) * 100;
          const cong = trials.filter((t) => t.is_congruent && t.is_correct).map((t) => t.reaction_time_ms);
          const incong = trials.filter((t) => !t.is_congruent && t.is_correct).map((t) => t.reaction_time_ms);
          const interference = cong.length > 0 && incong.length > 0 ? mean(incong) - mean(cong) : 0;
          const isOpen = expanded === s.id;

          return (
            <div key={s.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
              <button
                onClick={() => setExpanded(isOpen ? null : s.id)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--accent)] transition rounded-lg cursor-pointer"
              >
                {s.created_at.slice(0, 16)} | 主観: {s.subjective_score}/10 | 正答率: {acc.toFixed(1)}%
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <MiniMetric label="正答率" value={`${acc.toFixed(1)}%`} />
                    <MiniMetric label="干渉効果" value={`${interference.toFixed(0)} ms`} />
                    <MiniMetric label="一致 平均RT" value={cong.length > 0 ? `${mean(cong).toFixed(0)} ms` : "N/A"} />
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-sm text-[var(--destructive)] hover:underline cursor-pointer"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-4">
        {!confirmDeleteAll ? (
          <button
            onClick={() => setConfirmDeleteAll(true)}
            className="text-sm text-[var(--destructive)] hover:underline cursor-pointer"
          >
            全てのFlanker記録を削除
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[var(--yellow)]">本当に全てのFlanker記録を削除しますか？</p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAll}
                className="px-4 py-1 rounded bg-[var(--destructive)] text-white text-sm cursor-pointer"
              >
                はい、削除する
              </button>
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="px-4 py-1 rounded border border-[var(--border)] text-sm cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--background)] p-2">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

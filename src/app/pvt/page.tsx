"use client";

import { useState } from "react";
import { PvtTask } from "@/components/pvt-task";
import { PvtResults } from "@/components/pvt-results";
import { PVT_DEFAULT_DURATION_MIN } from "@/lib/constants";
import type { PvtTrial } from "@/lib/types";

type Phase = "setup" | "running" | "result";

export default function PvtPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [score, setScore] = useState(5);
  const [duration, setDuration] = useState(PVT_DEFAULT_DURATION_MIN);
  const [trials, setTrials] = useState<PvtTrial[]>([]);

  const handleComplete = async (result: PvtTrial[]) => {
    setTrials(result);
    await fetch("/api/pvt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjective_score: score, trials: result }),
    });
    setPhase("result");
  };

  if (phase === "running") {
    return (
      <div className="fixed inset-0 bg-[var(--background)] z-50 flex items-center justify-center">
        <PvtTask durationSec={duration * 60} onComplete={handleComplete} />
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">PVT 結果</h1>
        <PvtResults trials={trials} />
        <button
          onClick={() => setPhase("setup")}
          className="mt-6 px-6 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] transition"
        >
          新しいテスト
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">PVT - 精神運動覚醒検査</h1>
      <p className="text-[var(--muted-foreground)] mb-6">
        画面中央にカウンターが表示されたら、できるだけ速く <strong>スペースキー</strong> を押してください。
        カウンターが表示される前に押すとフォルススタート (FS) になります。
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2">
            現在の主観的コンディション: <strong>{score}</strong>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
          <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
            <span>1 (非常に悪い)</span>
            <span>10 (非常に良い)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2">テスト時間（分）</label>
          <input
            type="number"
            min={1}
            max={10}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-20 rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm"
          />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            学術的推奨値: 3分 (Basner & Dinges, 2011)
          </p>
        </div>

        <button
          onClick={() => setPhase("running")}
          className="px-6 py-2 rounded-lg bg-[var(--primary)] text-white font-semibold hover:brightness-110 transition cursor-pointer"
        >
          テスト開始
        </button>
      </div>
    </div>
  );
}

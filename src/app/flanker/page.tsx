"use client";

import { useState } from "react";
import { FlankerTask } from "@/components/flanker-task";
import { FlankerResults } from "@/components/flanker-results";
import { FLANKER_DEFAULT_TRIALS } from "@/lib/constants";
import type { FlankerTrial } from "@/lib/types";

type Phase = "setup" | "running" | "result";

export default function FlankerPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [score, setScore] = useState(5);
  const [numTrials, setNumTrials] = useState(FLANKER_DEFAULT_TRIALS);
  const [trials, setTrials] = useState<FlankerTrial[]>([]);

  const handleComplete = async (result: FlankerTrial[]) => {
    setTrials(result);
    await fetch("/api/flanker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjective_score: score, trials: result }),
    });
    setPhase("result");
  };

  if (phase === "running") {
    return (
      <div className="fixed inset-0 bg-[var(--background)] z-50 flex items-center justify-center">
        <FlankerTask numTrials={numTrials} onComplete={handleComplete} />
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Flanker 結果</h1>
        <FlankerResults trials={trials} />
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
      <h1 className="text-3xl font-bold mb-2">Flanker Task - フランカー課題</h1>
      <p className="text-[var(--muted-foreground)] mb-6">
        5つの矢印が表示されます。<strong>真ん中の矢印</strong>の向きだけを判断してください。
      </p>
      <div className="text-sm text-[var(--muted-foreground)] mb-6 space-y-1">
        <p>・左向き ◀ : <strong>F</strong> キー</p>
        <p>・右向き ▶ : <strong>J</strong> キー</p>
      </div>

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
          <label className="block text-sm mb-2">試行回数</label>
          <input
            type="number"
            min={10}
            max={80}
            step={2}
            value={numTrials}
            onChange={(e) => setNumTrials(Number(e.target.value))}
            className="w-20 rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm"
          />
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

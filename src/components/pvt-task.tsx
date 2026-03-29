"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { PVT_ISI_MIN_MS, PVT_ISI_MAX_MS, PVT_MINOR_LAPSE_MS, PVT_MAJOR_LAPSE_MS } from "@/lib/constants";
import type { PvtTrial } from "@/lib/types";

type Phase = "init" | "fixation" | "stimulus" | "result" | "complete";

interface PvtTaskProps {
  durationSec: number;
  onComplete: (trials: PvtTrial[]) => void;
}

export function PvtTask({ durationSec, onComplete }: PvtTaskProps) {
  const durationMs = durationSec * 1000;
  const [phase, setPhase] = useState<Phase>("init");
  const [displayText, setDisplayText] = useState("");
  const [displayClass, setDisplayClass] = useState("");
  const [subText, setSubText] = useState("スペースキーで反応します");
  const [trialLabel, setTrialLabel] = useState("");
  const [timerText, setTimerText] = useState("");

  const phaseRef = useRef<Phase>("init");
  const trialsRef = useRef<PvtTrial[]>([]);
  const trialIdxRef = useRef(0);
  const isiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerFrameRef = useRef<number | null>(null);
  const counterStartRef = useRef(0);
  const currentISIRef = useRef(0);
  const sessionStartRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const formatRemaining = (ms: number) => {
    const sec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const isTimeUp = useCallback(() => {
    return performance.now() - sessionStartRef.current >= durationMs;
  }, [durationMs]);

  const complete = useCallback(() => {
    phaseRef.current = "complete";
    setPhase("complete");
    if (timerFrameRef.current) cancelAnimationFrame(timerFrameRef.current);
    setTimerText("残り 0:00");
    setDisplayText("テスト完了");
    setDisplayClass("complete");
    setSubText("結果を処理中…");
    onCompleteRef.current(trialsRef.current);
  }, []);

  const showCounter = useCallback(() => {
    phaseRef.current = "stimulus";
    setPhase("stimulus");
    counterStartRef.current = performance.now();
    setDisplayText("0000 ms");
    setDisplayClass("counter");
    setSubText("スペースキーを押してください！");

    const tick = () => {
      if (phaseRef.current !== "stimulus") return;
      const elapsed = performance.now() - counterStartRef.current;
      setDisplayText(`${String(Math.round(elapsed)).padStart(4, " ")} ms`);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const nextTrial = useCallback(() => {
    if (isTimeUp()) {
      complete();
      return;
    }
    setTrialLabel(`試行 ${trialIdxRef.current + 1}`);
    phaseRef.current = "fixation";
    setPhase("fixation");
    setDisplayText("+");
    setDisplayClass("fixation");
    setSubText("刺激を待ってください…");

    const isi = PVT_ISI_MIN_MS + Math.random() * (PVT_ISI_MAX_MS - PVT_ISI_MIN_MS);
    currentISIRef.current = isi;
    isiTimerRef.current = setTimeout(showCounter, isi);
  }, [isTimeUp, complete, showCounter]);

  const respond = useCallback(() => {
    if (phaseRef.current === "fixation") {
      if (isiTimerRef.current) clearTimeout(isiTimerRef.current);
      trialsRef.current.push({
        trial_number: trialIdxRef.current + 1,
        isi_ms: Math.round(currentISIRef.current),
        reaction_time_ms: null,
        is_false_start: true,
      });
      phaseRef.current = "result";
      setPhase("result");
      setDisplayText("FS");
      setDisplayClass("fs");
      setSubText("フォルススタート");
      trialIdxRef.current++;
      setTimeout(nextTrial, 1500);
    } else if (phaseRef.current === "stimulus") {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const rt = performance.now() - counterStartRef.current;
      trialsRef.current.push({
        trial_number: trialIdxRef.current + 1,
        isi_ms: Math.round(currentISIRef.current),
        reaction_time_ms: Math.round(rt * 10) / 10,
        is_false_start: false,
      });
      phaseRef.current = "result";
      setPhase("result");

      let cls = "good";
      let lbl = "";
      if (rt > PVT_MAJOR_LAPSE_MS) {
        cls = "major";
        lbl = "Major Lapse";
      } else if (rt > PVT_MINOR_LAPSE_MS) {
        cls = "minor";
        lbl = "Minor Lapse";
      }
      setDisplayText(`${Math.round(rt)} ms`);
      setDisplayClass(cls);
      setSubText(lbl);
      trialIdxRef.current++;
      setTimeout(nextTrial, 1500);
    }
  }, [nextTrial]);

  const startSession = useCallback(() => {
    sessionStartRef.current = performance.now();

    const updateTimer = () => {
      if (phaseRef.current === "complete") return;
      const elapsed = performance.now() - sessionStartRef.current;
      const remaining = durationMs - elapsed;
      setTimerText(`残り ${formatRemaining(remaining)}`);
      if (remaining > 0) {
        timerFrameRef.current = requestAnimationFrame(updateTimer);
      }
    };
    updateTimer();
    nextTrial();
  }, [durationMs, nextTrial]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        respond();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      if (isiTimerRef.current) clearTimeout(isiTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerFrameRef.current) cancelAnimationFrame(timerFrameRef.current);
    };
  }, [respond]);

  const colorClass: Record<string, string> = {
    good: "text-[var(--green)]",
    minor: "text-[var(--yellow)]",
    major: "text-[var(--red)]",
    fs: "text-[var(--orange)]",
    fixation: "text-[#555]",
    counter: "text-[var(--red)]",
    complete: "text-[var(--blue)]",
  };

  if (phase === "init") {
    return (
      <div
        ref={containerRef}
        className="flex flex-col items-center justify-center h-[420px] select-none"
      >
        <button
          onClick={() => {
            containerRef.current?.focus();
            startSession();
          }}
          className="px-12 py-4 text-xl font-bold bg-[var(--red)] text-white rounded-lg hover:brightness-110 transition cursor-pointer"
        >
          ここをクリックしてスタート
        </button>
        <p className="text-[#888] mt-3 text-base">{subText}</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-[420px] select-none">
      <div className="absolute top-3 left-4 text-sm text-[#555] font-mono">
        {timerText}
      </div>
      <div className="absolute top-3 right-4 text-sm text-[#555]">
        {trialLabel}
      </div>
      <div
        className={`font-bold ${colorClass[displayClass] ?? ""} ${
          displayClass === "fixation"
            ? "text-[80px] font-light"
            : displayClass === "counter"
              ? "text-[64px] font-mono"
              : displayClass === "complete"
                ? "text-4xl"
                : "text-5xl"
        }`}
      >
        {displayText}
      </div>
      <p className="text-[#888] mt-3 text-base">{subText}</p>
    </div>
  );
}

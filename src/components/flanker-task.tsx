"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { FlankerTrial } from "@/lib/types";

type Phase = "init" | "fixation" | "stimulus" | "feedback" | "complete";

const STIMULI_MAP = [
  { stimulus: "◀◀◀◀◀", is_congruent: true, correct_response: "left" as const },
  { stimulus: "▶▶▶▶▶", is_congruent: true, correct_response: "right" as const },
  { stimulus: "▶▶◀▶▶", is_congruent: false, correct_response: "left" as const },
  { stimulus: "◀◀▶◀◀", is_congruent: false, correct_response: "right" as const },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateStimuli(numTrials: number) {
  const stims: (typeof STIMULI_MAP)[number][] = [];
  const half = Math.floor(numTrials / 2);
  for (let i = 0; i < half; i++) {
    stims.push(STIMULI_MAP[Math.random() < 0.5 ? 0 : 1]);
  }
  for (let i = 0; i < numTrials - half; i++) {
    stims.push(STIMULI_MAP[Math.random() < 0.5 ? 2 : 3]);
  }
  return shuffle(stims);
}

interface FlankerTaskProps {
  numTrials: number;
  onComplete: (trials: FlankerTrial[]) => void;
}

export function FlankerTask({ numTrials, onComplete }: FlankerTaskProps) {
  const [phase, setPhase] = useState<Phase>("init");
  const [displayText, setDisplayText] = useState("");
  const [displayClass, setDisplayClass] = useState("");
  const [subText, setSubText] = useState("真ん中の矢印の向きだけを判断してください");
  const [progressText, setProgressText] = useState("");
  const [showKeys, setShowKeys] = useState(true);

  const phaseRef = useRef<Phase>("init");
  const trialsRef = useRef<FlankerTrial[]>([]);
  const trialIdxRef = useRef(0);
  const stimuliRef = useRef<ReturnType<typeof generateStimuli>>([]);
  const stimulusStartRef = useRef(0);
  const currentStimRef = useRef<(typeof STIMULI_MAP)[number] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const complete = useCallback(() => {
    phaseRef.current = "complete";
    setPhase("complete");
    setDisplayText("テスト完了");
    setDisplayClass("complete");
    setSubText("結果を処理中…");
    setShowKeys(false);
    onCompleteRef.current(trialsRef.current);
  }, []);

  const showStimulus = useCallback(() => {
    phaseRef.current = "stimulus";
    setPhase("stimulus");
    currentStimRef.current = stimuliRef.current[trialIdxRef.current];
    stimulusStartRef.current = performance.now();
    setDisplayText(currentStimRef.current.stimulus);
    setDisplayClass("stimulus");
    setSubText("");
  }, []);

  const nextTrial = useCallback(() => {
    if (trialIdxRef.current >= numTrials) {
      complete();
      return;
    }
    setProgressText(`${trialIdxRef.current + 1} / ${numTrials}`);
    phaseRef.current = "fixation";
    setPhase("fixation");
    setDisplayText("+");
    setDisplayClass("fixation");
    setSubText("");
    setShowKeys(true);
    setTimeout(showStimulus, 500);
  }, [numTrials, complete, showStimulus]);

  const respond = useCallback(
    (userDir: "left" | "right") => {
      if (phaseRef.current !== "stimulus") return;
      const rt = performance.now() - stimulusStartRef.current;
      const stim = currentStimRef.current!;
      const isCorrect = userDir === stim.correct_response;

      trialsRef.current.push({
        trial_number: trialIdxRef.current + 1,
        is_congruent: stim.is_congruent,
        stimulus: stim.stimulus,
        correct_response: stim.correct_response,
        user_response: userDir,
        is_correct: isCorrect,
        reaction_time_ms: Math.round(rt * 10) / 10,
      });

      phaseRef.current = "feedback";
      setPhase("feedback");
      if (isCorrect) {
        setDisplayText(`○ ${Math.round(rt)} ms`);
        setDisplayClass("correct");
      } else {
        setDisplayText("× 不正解");
        setDisplayClass("incorrect");
      }
      setSubText("");
      trialIdxRef.current++;
      setTimeout(nextTrial, 600);
    },
    [nextTrial]
  );

  const startSession = useCallback(() => {
    stimuliRef.current = generateStimuli(numTrials);
    nextTrial();
  }, [numTrials, nextTrial]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "KeyF") {
        e.preventDefault();
        respond("left");
      }
      if (e.code === "KeyJ") {
        e.preventDefault();
        respond("right");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [respond]);

  const colorClass: Record<string, string> = {
    fixation: "text-[#555]",
    stimulus: "text-[#fafafa]",
    correct: "text-[var(--green)]",
    incorrect: "text-[var(--red)]",
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
          className="px-12 py-4 text-xl font-bold bg-[var(--blue)] text-white rounded-lg hover:brightness-110 transition cursor-pointer"
        >
          ここをクリックしてスタート
        </button>
        <p className="text-[#888] mt-3 text-base">{subText}</p>
        <KeyHints />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-[420px] select-none">
      <div className="absolute top-3 right-4 text-sm text-[#555]">
        {progressText}
      </div>
      <div
        className={`font-bold ${colorClass[displayClass] ?? ""} ${
          displayClass === "fixation"
            ? "text-[80px] font-light"
            : displayClass === "stimulus"
              ? "text-[72px] font-mono tracking-[12px]"
              : displayClass === "complete"
                ? "text-4xl"
                : "text-4xl"
        }`}
      >
        {displayText}
      </div>
      <p className="text-[#888] mt-3 text-base">{subText}</p>
      {showKeys && <KeyHints />}
    </div>
  );
}

function KeyHints() {
  return (
    <div className="flex gap-15 mt-6 text-sm text-[#666]">
      <div className="flex flex-col items-center gap-1">
        <span className="px-3 py-1 border border-[#444] rounded font-mono text-base text-[#aaa]">
          F
        </span>
        <span>◀ 左</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="px-3 py-1 border border-[#444] rounded font-mono text-base text-[#aaa]">
          J
        </span>
        <span>▶ 右</span>
      </div>
    </div>
  );
}

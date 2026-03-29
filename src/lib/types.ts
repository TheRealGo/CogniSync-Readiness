export interface Session {
  id: number;
  task_type: "pvt" | "flanker";
  subjective_score: number;
  created_at: string;
}

export interface PvtTrial {
  trial_number: number;
  isi_ms: number;
  reaction_time_ms: number | null;
  is_false_start: boolean;
}

export interface FlankerTrial {
  trial_number: number;
  is_congruent: boolean;
  stimulus: string;
  correct_response: "left" | "right";
  user_response: "left" | "right" | null;
  is_correct: boolean;
  reaction_time_ms: number;
}

export interface PvtSessionWithTrials extends Session {
  trials: PvtTrial[];
}

export interface FlankerSessionWithTrials extends Session {
  trials: FlankerTrial[];
}

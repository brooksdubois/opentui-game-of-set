export type EngineCommandName =
  | "new_game"
  | "get_state"
  | "toggle_select"
  | "submit_selection"
  | "submit_high_score"
  | "deal_more"
  | "re_deal"
  | "hint"
  | "reset"
  | "shutdown";

export interface EngineCommand {
  command: EngineCommandName;
  index?: number;
  initials?: string;
}

export interface EngineCardDto {
  index: number;
  shape: "S" | "O" | "D";
  color: "R" | "G" | "B";
  fill: "L" | "S" | "F";
  count: "1" | "2" | "3";
  selected: boolean;
}

export interface EngineStateDto {
  board: EngineCardDto[];
  selectedIndexes: number[];
  remainingCards: number;
  foundSets: number;
  score: number;
  leaderboard: EngineLeaderboardEntryDto[];
  leaderboardPendingEntry: boolean;
  status: string;
  hasAnySetOnBoard: boolean;
  gameComplete: boolean;
  gameOver: boolean;
}

export interface EngineScoreEventDto {
  label: string;
  points: number;
}

export interface EngineLeaderboardEntryDto {
  initials: string;
  score: number;
  achievedAt: string;
}

export interface EngineSubmissionDto {
  isSet: boolean;
  selectedIndexes: number[];
}

export interface EngineStateResponse {
  type: "state";
  ok: true;
  command: EngineCommandName;
  state: EngineStateDto;
  message?: string;
  submission?: EngineSubmissionDto;
  hintIndexes?: number[];
  scoreEvents?: EngineScoreEventDto[];
}

export interface EngineErrorResponse {
  type: "error";
  ok: false;
  command?: EngineCommandName;
  code: string;
  message: string;
}

export interface EngineAckResponse {
  type: "ack";
  ok: true;
  command: EngineCommandName;
  message: string;
}

export type EngineResponse = EngineStateResponse | EngineErrorResponse | EngineAckResponse;

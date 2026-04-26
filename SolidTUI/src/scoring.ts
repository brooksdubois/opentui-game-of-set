import type { EngineScoreEventDto } from "./engine/protocol";

export interface LeaderboardEntry {
  initials: string;
  score: number;
  achievedAt: string;
}

export interface BonusTickerEvent {
  id: string;
  label: string;
  points: number;
  createdAt: number;
  ttlMs: number;
}

const BONUS_TTL_MS = 1_600;

export function toBonusTickerEvents(events: EngineScoreEventDto[], createdAt: number): BonusTickerEvent[] {
  return events.map((event) => {
    const sign = event.points >= 0 ? "+" : "";
    return {
      id: `${createdAt}-${event.label}-${event.points}`,
      label: `${sign}${event.points} ${event.label}`,
      points: event.points,
      createdAt,
      ttlMs: BONUS_TTL_MS,
    };
  });
}

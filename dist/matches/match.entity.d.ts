import { Matchday } from '../matchdays/matchday.entity';
export declare enum MatchStatus {
    SCHEDULED = "SCHEDULED",
    LIVE = "LIVE",
    FINISHED = "FINISHED",
    POSTPONED = "POSTPONED",
    CANCELLED = "CANCELLED"
}
export declare class Match {
    id: number;
    matchday_id: number;
    matchday: Matchday;
    home_team: string;
    away_team: string;
    home_logo_url: string;
    away_logo_url: string;
    match_date: Date;
    status: MatchStatus;
    home_score: number;
    away_score: number;
    api_football_id: number;
    created_at: Date;
    updated_at: Date;
}

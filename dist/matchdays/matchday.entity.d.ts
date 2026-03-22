import { Competition } from '../competitions/competition.entity';
import { Match } from '../matches/match.entity';
export declare enum TorneoType {
    APERTURA = "Apertura",
    CLAUSURA = "Clausura",
    UNICO = "\u00DAnico",
    OTRO = "Otro"
}
export declare class Matchday {
    id: number;
    competition_id: number;
    competition: Competition;
    name: string;
    season: string;
    torneo: string;
    round_number: number;
    start_date: Date;
    end_date: Date;
    is_finished: boolean;
    created_at: Date;
    matches: Match[];
}

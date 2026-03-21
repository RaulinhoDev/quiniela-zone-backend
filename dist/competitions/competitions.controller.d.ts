import { CompetitionsService } from './competitions.service';
export declare class CompetitionsController {
    private service;
    constructor(service: CompetitionsService);
    findAll(): Promise<import("./competition.entity").Competition[]>;
    findOne(id: number): Promise<import("./competition.entity").Competition>;
    getMatchdays(id: number): Promise<import("../matchdays/matchday.entity").Matchday[]>;
    getMatchday(id: number): Promise<import("../matchdays/matchday.entity").Matchday>;
    syncTemporada(body: {
        competition_api_id: number;
        season: string;
    }): Promise<void>;
    createMatchday(body: any): Promise<import("../matchdays/matchday.entity").Matchday>;
    createMatch(body: any): Promise<import("../matches/match.entity").Match>;
    updateResult(id: number, body: {
        home_score: number;
        away_score: number;
    }): Promise<import("../matches/match.entity").Match>;
}

import { Quiniela } from './quiniela.entity';
export declare class ScoringRule {
    id: number;
    quiniela_id: number;
    quiniela: Quiniela;
    exact_score_pts: number;
    correct_winner_pts: number;
    wrong_pts: number;
    double_points_final: boolean;
}

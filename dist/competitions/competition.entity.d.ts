export declare enum CompetitionRegion {
    HONDURAS = "HN",
    COSTA_RICA = "CR",
    GUATEMALA = "GT",
    EL_SALVADOR = "SV",
    NICARAGUA = "NI",
    PANAMA = "PA",
    BELIZE = "BZ",
    CONCACAF = "CONCACAF",
    MUNDIAL = "MUNDIAL"
}
export declare class Competition {
    id: number;
    name: string;
    short_name: string;
    region: CompetitionRegion;
    logo_url: string;
    api_football_id: number;
    is_active: boolean;
    is_manual: boolean;
    created_at: Date;
}

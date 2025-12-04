export interface MarkerRoute {
    type: string;
    coordinates: number[][];
}

export interface BattleData {
    battleId: string;
    battleName: string;
    details: string;
    latitude: number;
    longitude: number;
    winnerGeneral: string;
    loserGeneral: string;
    battleDate: string;
    markerRoute: MarkerRoute | null;
    routeColor?: string;  // Optional route color (hex code)
    warId: string;
    warName: string;
}

export interface WarData {
    warId: string;
    name: string;
    details: string;
    warStartDate: string;
    warEndDate: string;
    result: string;
    summary: string;
    attackCountryId: string;
    attackCountryName: string;
    defenceCountryId: string;
    defenceCountryName: string;
    battles: BattleData[];
}

export const fetchWarData = async (year: number): Promise<WarData[]> => {
    try {
        const response = await fetch(`http://localhost:8080/api/wars/${year}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch war data: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching war data:', error);
        return [];
    }
};

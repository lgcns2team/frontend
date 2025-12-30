const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
        const token = localStorage.getItem('accessToken');
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/wars/${year}`, {
            headers
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch war data: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching war data:', error);
        return [];
    }
};

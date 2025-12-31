// Korean War Frontline API
// Fetches frontline, battle, and movement data for 6.25 Korean War

export interface FrontlineData {
    date: string;
    phase: string;
    description: string;
    coordinates: number[][];
}

export interface KoreanWarBattle {
    name: string;
    date: string;
    winner: string;
    loser: string;
    description: string;
    coordinates: [number, number]; // [lng, lat]
}

export interface KoreanWarMovement {
    name: string;
    date: string;
    side: 'north' | 'south' | 'china';
    unit_type: 'infantry' | 'navy';
    description: string;
    coordinates: number[][];
}

export interface KoreanWarData {
    frontlines: FrontlineData[];
    battles: KoreanWarBattle[];
    movements: KoreanWarMovement[];
}

// Parse date string to Date object
export const parseDate = (dateStr: string): Date => {
    return new Date(dateStr);
};

// Get all unique dates from frontline data for timeline
export const getAllDates = (frontlines: FrontlineData[]): string[] => {
    return frontlines.map(f => f.date).sort();
};

// Find frontline for specific date (interpolate if needed)
export const getFrontlineForDate = (
    frontlines: FrontlineData[],
    targetDate: string
): FrontlineData | null => {
    // Sort frontlines by date
    const sorted = [...frontlines].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const target = new Date(targetDate).getTime();

    // Find exact match
    const exact = sorted.find(f => f.date === targetDate);
    if (exact) return exact;

    // Find surrounding dates for interpolation
    let before: FrontlineData | null = null;
    let after: FrontlineData | null = null;

    for (const fl of sorted) {
        const flTime = new Date(fl.date).getTime();
        if (flTime <= target) {
            before = fl;
        } else if (!after && flTime > target) {
            after = fl;
            break;
        }
    }

    // Return the most recent frontline if no interpolation possible
    return before || after;
};

// Get battles for specific date
export const getBattlesForDate = (
    battles: KoreanWarBattle[],
    targetDate: string
): KoreanWarBattle[] => {
    return battles.filter(b => b.date <= targetDate);
};

// Get active movements for date range (within 3 days)
export const getActiveMovements = (
    movements: KoreanWarMovement[],
    targetDate: string
): KoreanWarMovement[] => {
    const target = new Date(targetDate).getTime();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    return movements.filter(m => {
        const moveTime = new Date(m.date).getTime();
        return Math.abs(moveTime - target) <= threeDays;
    });
};

import { fetchWarData } from './war-api';

// Fetch Korean War data from Backend and GeoJSON
export const fetchKoreanWarData = async (): Promise<KoreanWarData> => {
    try {
        // Fetch frontlines from GeoJSON (still static)
        const frontlinesRes = await fetch('/geojson/korean_war_frontlines.geojson');
        const frontlinesGeo = await frontlinesRes.json();

        // Parse frontlines
        const frontlines: FrontlineData[] = frontlinesGeo.features.map((f: any) => ({
            date: f.properties.date,
            phase: f.properties.phase,
            description: f.properties.description,
            coordinates: f.geometry.coordinates
        }));

        // Fetch War Data from Backend (Year 1950 covers the war)
        const wars = await fetchWarData(1950);
        const koreanWar = wars.find(w => w.name.includes('6.25') || w.name.includes('한국전쟁'));

        let battles: KoreanWarBattle[] = [];
        let movements: KoreanWarMovement[] = [];

        if (koreanWar && koreanWar.battles) {
            koreanWar.battles.forEach(b => {
                if (b.markerRoute) {
                    // It's a movement
                    let side: 'north' | 'south' | 'china' = 'south';
                    if (b.routeColor === '#ef4444') {
                        side = 'north';
                    }
                    if (b.battleName.includes('중공군') || b.battleName.includes('중국')) {
                        side = 'china';
                    }

                    let unitType: 'infantry' | 'navy' = 'infantry';
                    if (b.battleName.includes('상륙') || b.battleName.includes('해군')) {
                        unitType = 'navy';
                    } else if (b.markerRoute.coordinates.length > 0 && Array.isArray(b.markerRoute.coordinates[0]) && b.markerRoute.coordinates[0].length >= 2) {
                        // Check if coordinates imply sea? No, hard to tell. Rely on name.
                    }

                    movements.push({
                        name: b.battleName,
                        date: b.battleDate,
                        side: side,
                        unit_type: unitType,
                        description: b.details,
                        coordinates: b.markerRoute.coordinates
                    });
                } else {
                    // It's a battle point
                    // Infer winner/loser from backend data (which might be generic "UN군", "북한" etc)
                    battles.push({
                        name: b.battleName,
                        date: b.battleDate,
                        winner: b.winnerGeneral || 'Unknown',
                        loser: b.loserGeneral || 'Unknown',
                        description: b.details,
                        coordinates: [b.longitude, b.latitude]
                    });
                }
            });
        }

        return { frontlines, battles, movements };
    } catch (error) {
        console.error('Failed to fetch Korean War data:', error);
        return { frontlines: [], battles: [], movements: [] };
    }
};

// Check if a year is within Korean War period
export const isKoreanWarPeriod = (year: number): boolean => {
    return year >= 1950 && year <= 1953;
};

// Generate all dates between start and end
export const generateDateRange = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    while (start <= end) {
        dates.push(start.toISOString().split('T')[0]);
        start.setDate(start.getDate() + 1);
    }

    return dates;
};

// Korean War date range
export const KOREAN_WAR_START = '1950-06-25';
export const KOREAN_WAR_END = '1953-07-27';

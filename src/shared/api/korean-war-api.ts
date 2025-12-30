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
    return battles.filter(b => b.date === targetDate);
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

// Fetch Korean War data from GeoJSON files
export const fetchKoreanWarData = async (): Promise<KoreanWarData> => {
    try {
        const [frontlinesRes, battlesRes, movementsRes] = await Promise.all([
            fetch('/geojson/korean_war_frontlines.geojson'),
            fetch('/geojson/korean_war_battles.geojson'),
            fetch('/geojson/korean_war_movements.geojson')
        ]);

        const [frontlinesGeo, battlesGeo, movementsGeo] = await Promise.all([
            frontlinesRes.json(),
            battlesRes.json(),
            movementsRes.json()
        ]);

        // Parse frontlines
        const frontlines: FrontlineData[] = frontlinesGeo.features.map((f: any) => ({
            date: f.properties.date,
            phase: f.properties.phase,
            description: f.properties.description,
            coordinates: f.geometry.coordinates
        }));

        // Parse battles
        const battles: KoreanWarBattle[] = battlesGeo.features.map((f: any) => ({
            name: f.properties.name,
            date: f.properties.date,
            winner: f.properties.winner,
            loser: f.properties.loser,
            description: f.properties.description,
            coordinates: f.geometry.coordinates as [number, number]
        }));

        // Parse movements
        const movements: KoreanWarMovement[] = movementsGeo.features.map((f: any) => ({
            name: f.properties.name,
            date: f.properties.date,
            side: f.properties.side,
            unit_type: f.properties.unit_type,
            description: f.properties.description,
            coordinates: f.geometry.coordinates
        }));

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

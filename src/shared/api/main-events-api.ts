export interface MainEvent {
    eventId: string;
    eventName: string;
    year: number;
    era: string | null;
    summary: string;
    type: string;
    countryName: string;
    countryId?: string;
    shortName?: string;
    showTimeline?: boolean;
}

export type ParsedMainEvent = MainEvent;

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchMainEvents = async (): Promise<MainEvent[]> => {
    try {
        const token = localStorage.getItem('accessToken');
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/main-event`, {
            headers
        });
        if (!response.ok) {
            throw new Error('Failed to fetch main events');
        }
        const rawData = await response.json();

        if (!Array.isArray(rawData)) {
            console.warn("Main events API response is not an array:", rawData);
            return [];
        }

        console.log("Raw Main Event Data (Sample):", rawData[0]);

        const data: MainEvent[] = rawData
            .map((item: any) => ({
                eventId: item.eventId || `event-${Math.random().toString(36).substr(2, 9)}`,
                eventName: item.eventName || '이름 없는 사건',
                year: typeof item.year === 'number' ? item.year : parseInt(item.year),
                era: item.era || null,
                summary: item.summary || '',
                type: item.type || 'Event',
                countryName: item.countryName || '',
                countryId: item.countryId,
                shortName: item.shortName || item.short_name || item.short || null,
                showTimeline: item.show_timeline === true || item.timeline === true || item.showTimeline === true
            }))
            .filter(event => !isNaN(event.year) && event.year !== null);

        console.log("Mapped Main Event Data (Sample):", data[0]);
        console.log("Total events:", data.length);
        return data;
    } catch (error) {
        console.error('Error fetching main events:', error);
        return [];
    }
};

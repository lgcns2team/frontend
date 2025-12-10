export interface MainEvent {
    eventId: string;
    eventName: string;
    year: number;
    era: string | null;
    summary: string;
    type: string;
    countryName: string;
    countryId?: string;
}

export type ParsedMainEvent = MainEvent;

const API_BASE_URL = '/api';

export const fetchMainEvents = async (): Promise<MainEvent[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/main-event`);
        if (!response.ok) {
            throw new Error('Failed to fetch main events');
        }
        const rawData = await response.json();

        if (!Array.isArray(rawData)) {
            console.warn("Main events API response is not an array:", rawData);
            return [];
        }

        const data: MainEvent[] = rawData
            .map((item: any) => ({
                eventId: item.eventId || `event-${Math.random().toString(36).substr(2, 9)}`,
                eventName: item.eventName || '이름 없는 사건',
                year: typeof item.year === 'number' ? item.year : parseInt(item.year),
                era: item.era || null,
                summary: item.summary || '',
                type: item.type || 'Event',
                countryName: item.countryName || '',
                countryId: item.countryId
            }))
            .filter(event => !isNaN(event.year) && event.year !== null);

        console.log("Fetched main events:", data.length);
        return data;
    } catch (error) {
        console.error('Error fetching main events:', error);
        return [];
    }
};

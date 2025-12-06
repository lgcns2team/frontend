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
        const data: MainEvent[] = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching main events:', error);
        return [];
    }
};

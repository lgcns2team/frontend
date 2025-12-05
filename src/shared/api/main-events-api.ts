export interface MainEvent {
    eventId: string;
    eventName: string;
    year: number;
    era: string;
    description: string; // JSON string containing summary and significance
    countryId: string;
    countryName: string;
}

export interface ParsedMainEvent extends Omit<MainEvent, 'description'> {
    description: {
        summary: string;
        significance: string;
    };
}

const API_BASE_URL = '/api';

export const fetchMainEvents = async (): Promise<ParsedMainEvent[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/main-event`);
        if (!response.ok) {
            throw new Error('Failed to fetch main events');
        }
        const data: MainEvent[] = await response.json();

        // Parse the description JSON string
        return data.map(event => {
            let parsedDesc = { summary: '', significance: '' };
            try {
                parsedDesc = JSON.parse(event.description);
            } catch (e) {
                console.error('Failed to parse event description:', event.description);
            }
            return {
                ...event,
                description: parsedDesc
            };
        });
    } catch (error) {
        console.error('Error fetching main events:', error);
        return [];
    }
};

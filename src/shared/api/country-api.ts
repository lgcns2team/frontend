
export interface CountryData {
    countryId: string;
    countryName: string;
    foundationYear: number;
    endedYear: number;
    countryCode: number;
    title: string;
    description: string;
    summary: string;
}

const API_BASE_URL = '/api';

export const fetchCountryByCode = async (code: string): Promise<CountryData | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/countries/${code}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch country data for code: ${code}`);
        }
        const data: CountryData = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching country data:', error);
        return null;
    }
};

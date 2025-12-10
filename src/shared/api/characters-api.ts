export interface Character {
    characterId: string;
    characterName: string;
    birthYear: number | null;
    deathYear: number | null;
    era: string | null;
    summary: string;
    occupation?: string | null;
    countryName?: string;
    countryId?: string;
    imagePath?: string;
}

export type ParsedCharacter = Character;

const API_BASE_URL = '/api';

export const fetchCharacters = async (): Promise<Character[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/characters`);
        if (!response.ok) {
            throw new Error('Failed to fetch characters');
        }
        const data: Character[] = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching characters:', error);
        return [];
    }
};

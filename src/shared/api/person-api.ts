// API for fetching AI Person data

export interface PersonData {
    promptId: string;
    name: string;
    era: string;
    year: number;
    deathYear: number | null;
    latitude: number;
    longitude: number;
    summary: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchAllPersons(): Promise<PersonData[]> {
    try {
        const token = localStorage.getItem('accessToken');
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/ai-person`, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch persons:', error);
        return [];
    }
}

export async function fetchPersonsByYear(year: number): Promise<PersonData[]> {
    const allPersons = await fetchAllPersons();
    console.log('[Person API] All persons:', allPersons);
    console.log('[Person API] Current year:', year);

    // Filter persons who were alive during the current year
    // Show person if: birthYear <= currentYear <= deathYear
    const filtered = allPersons.filter(person => {
        const birthYear = person.year;
        const deathYear = person.deathYear ?? (birthYear + 100); // Default to 100 years if no death year
        const isAlive = birthYear <= year && year <= deathYear;
        console.log(`[Person API] ${person.name}: birth=${birthYear}, death=${person.deathYear}, deathUsed=${deathYear}, year=${year}, show=${isAlive}`);
        return isAlive;
    });

    console.log('[Person API] Filtered persons:', filtered.length);
    return filtered;
}


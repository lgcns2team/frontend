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

// Cache for person data - fetched once, reused for filtering
let personCache: PersonData[] | null = null;
let cachePromise: Promise<PersonData[]> | null = null;

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

    // Return cached data if available
    if (personCache !== null) {
        console.log('[Person API] Using cached data');
        return personCache;

    }

    // If a fetch is already in progress, wait for it
    if (cachePromise !== null) {
        console.log('[Person API] Waiting for existing fetch');
        return cachePromise;
    }

    // Fetch and cache
    console.log('[Person API] Fetching from server (first time)');
    cachePromise = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/ai-person`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            personCache = data;
            console.log('[Person API] Data cached:', data.length, 'persons');
            return data;
        } catch (error) {
            console.error('Failed to fetch persons:', error);
            cachePromise = null; // Allow retry on error
            return [];
        }
    })();

    return cachePromise;
}

export async function fetchPersonsByYear(year: number): Promise<PersonData[]> {
    const allPersons = await fetchAllPersons();

    // Filter persons who were alive during the current year
    // Show person if: birthYear <= currentYear <= deathYear
    const filtered = allPersons.filter(person => {
        const birthYear = person.year;
        const deathYear = person.deathYear ?? (birthYear + 100); // Default to 100 years if no death year
        return birthYear <= year && year <= deathYear;
    });

    console.log('[Person API] Filtered for year', year, ':', filtered.length, 'persons');
    return filtered;
}

// Function to clear cache if needed (e.g., after data update)
export function clearPersonCache(): void {
    personCache = null;
    cachePromise = null;
    console.log('[Person API] Cache cleared');
}

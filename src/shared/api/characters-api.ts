import { getEraForYear, normalizeEraName } from '../config/era-theme';

export interface Character {
    characterId: string;
    characterName: string;
    birthYear: number | null;
    deathYear?: number | null;
    era: string | null;
    summary: string;
    occupation?: string | null;
    countryName?: string;
    countryId?: string;
    imagePath?: string;
    promptId?: string;
    greetingMessage?: string;
}

export type ParsedCharacter = Character;

export const fetchCharacters = async (): Promise<Character[]> => {
    try {
        const response = await fetch(`/api/ai-person`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log("Characters API Response Status:", response.status);
        if (!response.ok) {
            throw new Error('Failed to fetch characters');
        }

        const jsonResponse = await response.json();
        console.log("Characters API Raw Response:", jsonResponse);

        let dataList: any[] = [];

        // 응답이 배열인 경우
        if (Array.isArray(jsonResponse)) {
            dataList = jsonResponse;
        }
        // 응답이 객체이고 내부에 리스트가 있는 경우 (예: { data: [...] } 또는 { result: [...] })
        else if (typeof jsonResponse === 'object' && jsonResponse !== null) {
            if (Array.isArray(jsonResponse.data)) {
                dataList = jsonResponse.data;
            } else if (Array.isArray(jsonResponse.result)) {
                dataList = jsonResponse.result;
            } else if (Array.isArray(jsonResponse.items)) {
                dataList = jsonResponse.items;
            } else {
                // 배열을 찾을 수 없는 경우
                console.warn("Could not find array in response object, trying to map object keys if it looks like a map or single item wrapped.");
                // 만약 단일 객체라면 배열로 감쌈
                dataList = [jsonResponse];
            }
        }

        // 데이터 매핑: 백엔드 필드명이 다를 경우를 대비해 여기서 매핑
        // 현재는 필드명이 같다고 가정하되, 없는 필드는 기본값을 할당
        const mappedData: Character[] = dataList.map((item: any, index: number) => {
            // 이미지 순환 할당 (kwang, elji, kimyusin)
            const dummyImages = [
                '/assets/images/character/kwang.png',
                '/assets/images/character/elji.png',
                '/assets/images/character/kimyusin.png'
            ];
            const fallbackImage = dummyImages[index % dummyImages.length];

            // birthYear 또는 year 필드 사용
            const rawBirthYear = item.birthYear !== undefined ? item.birthYear : item.year;
            const birthYear = typeof rawBirthYear === 'number' ? rawBirthYear : (parseInt(rawBirthYear) || null);

            let era = item.era || null;

            // 한글 era 매핑 (예: "고조선" -> "gojoseon", "삼국시대(신라)" -> "삼국시대", "대한제국시대" -> "korean-empire")
            if (era) {
                // 공통 정규화 로직 사용
                const normalized = normalizeEraName(era);
                if (normalized) {
                    era = normalized;
                }
            }

            // era가 없고 birthYear가 있다면 연도로 era 추론
            if (!era && birthYear !== null) {
                const eraInfo = getEraForYear(birthYear);
                era = eraInfo.id;
            }

            return {
                characterId: item.characterId || item.id || `char-${Math.random().toString(36).substr(2, 9)}`,
                characterName: item.characterName || item.name || '이름 없음',
                birthYear: birthYear,
                deathYear: typeof item.deathYear === 'number' ? item.deathYear : (parseInt(item.deathYear) || null),
                era: era,
                summary: item.summary || item.description || '',
                occupation: item.occupation || null,
                countryName: item.countryName || item.country || '',
                imagePath: item.imagePath || item.image || item.img || fallbackImage,
                promptId: item.promptID || item.promptId || item.id, // promptID 매핑
                greetingMessage: item.greetingMessage || item.greeting || null
            };
        });

        console.log("Mapped Characters Data:", mappedData);
        return mappedData;
    } catch (error) {
        console.error('Error fetching characters:', error);
        return [];
    }
};

export const fetchCharacterDetail = async (promptId: string): Promise<{ summary?: string, greetingMessage?: string }> => {
    try {
        const response = await fetch(`/api/ai-person/${promptId}`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch character detail for ${promptId}`);
        }
        const data = await response.json();
        console.log(`Fetched detail for ${promptId}:`, data);

        // 데이터 구조에 따라 summary 및 greeting 추출
        let summary = '';
        let greetingMessage = '';

        // Summary Extraction
        if (data.summary) summary = data.summary;
        else if (data.description) summary = data.description;
        else if (data.data && data.data.summary) summary = data.data.summary;
        else if (data.result && data.result.summary) summary = data.result.summary;

        // Greeting Extraction
        if (data.greetingMessage) greetingMessage = data.greetingMessage;
        else if (data.greeting) greetingMessage = data.greeting;
        else if (data.data && data.data.greetingMessage) greetingMessage = data.data.greetingMessage;
        else if (data.result && data.result.greetingMessage) greetingMessage = data.result.greetingMessage;

        return { summary, greetingMessage };
    } catch (error) {
        console.error(`Error fetching detail for ${promptId}:`, error);
        return {};
    }
};

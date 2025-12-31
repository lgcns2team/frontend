export interface TextbookEra {
    startPage: number;
    endPage: number;
    year: number;
    description: string;
}

// Maps textbook page ranges to representative historical years
// Based on typical content flow: Gojoseon -> Three Kingdoms -> Goryeo -> Joseon -> Modern
export const TEXTBOOK_ERA_MAP: TextbookEra[] = [
    { startPage: 0, endPage: 20, year: -2333, description: '고조선 건국' },
    { startPage: 21, endPage: 40, year: 372, description: '삼국 시대 (소수림왕)' },
    { startPage: 41, endPage: 60, year: 612, description: '살수대첩 (을지문덕)' },
    { startPage: 61, endPage: 80, year: 668, description: '삼국 통일 (신라)' },
    { startPage: 81, endPage: 100, year: 993, description: '고려 건국 및 거란 침입 (서희)' },
    { startPage: 101, endPage: 120, year: 1392, description: '조선 건국' },
    { startPage: 121, endPage: 130, year: 1592, description: '임진왜란 (이순신)' },
    { startPage: 131, endPage: 150, year: 1724, description: '조선 후기 (영조/정조)' },
    { startPage: 151, endPage: 180, year: 1897, description: '대한제국 및 근대화' },
    { startPage: 181, endPage: 220, year: 1919, description: '일제 강점기 및 독립 운동' }
];

export const getEraForPage = (page: number): number | null => {
    // page is 0-indexed in code, but typically 1-indexed in ranges.
    // Assuming the map above uses typical 1-based page numbers for readability, 
    // but the input 'page' might be 0-based.
    // Let's assume input 'page' is 0-indexed (array index) to match TextbookPanel props.
    // So we add 1 for comparison or adjust the data.
    // Let's adjust the input to 1-based for matching.
    const pageNum = page + 1;

    const era = TEXTBOOK_ERA_MAP.find(e => pageNum >= e.startPage && pageNum <= e.endPage);
    return era ? era.year : null;
};

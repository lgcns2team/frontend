export const getEraName = (year: number): string => {
    if (year < 918) return '삼국/남북국시대';
    if (year < 1392) return '고려시대';
    if (year < 1897) return '조선시대';
    if (year < 1910) return '대한제국';
    if (year < 1945) return '일제강점기';
    return '현대';
};

export const getEraColor = (year: number): string => {
    if (year < -108) return '#f4daa5ff'; // Gojoseon
    if (year < 300) return '#fca5a5';  // Proto-Three Kingdoms
    if (year < 698) return '#93c5fd';  // Three Kingdoms
    if (year < 926) return '#fdba74';  // North-South States
    if (year < 1392) return '#c4b5fd'; // Goryeo
    if (year < 1897) return '#86efac'; // Joseon
    return '#fcd34d';                  // Modern
};

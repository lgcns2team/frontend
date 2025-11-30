export type EraType = 'ancient' | 'medieval' | 'modern' | 'contemporary';

export interface EraConfig {
    id: EraType;
    label: string;
    labelEn: string;
    description: string;
    startYear: number;
    endYear: number;
    fontFamily: string;
}

export const ERAS: EraConfig[] = [
    {
        id: 'ancient',
        label: '고대',
        labelEn: 'Ancient',
        description: '거친 돌과 암각화의 시대',
        startYear: -Infinity,
        endYear: 500,
        fontFamily: "'Cinzel', serif"
    },
    {
        id: 'medieval',
        label: '중세',
        labelEn: 'Medieval',
        description: '양피지와 붓글씨의 시대',
        startYear: 501,
        endYear: 1500,
        fontFamily: "'Noto Serif KR', serif"
    },
    {
        id: 'modern',
        label: '근대',
        labelEn: 'Modern',
        description: '격동의 근대와 인쇄술',
        startYear: 1501,
        endYear: 1950,
        fontFamily: "'Nanum Myeongjo', serif"
    },
    {
        id: 'contemporary',
        label: '현대',
        labelEn: 'Contemporary',
        description: '디지털과 연결의 시대',
        startYear: 1951,
        endYear: Infinity,
        fontFamily: "'Pretendard', sans-serif"
    }
];

export const getEraForYear = (year: number): EraConfig => {
    return ERAS.find(era => year >= era.startYear && year <= era.endYear) || ERAS[0];
};

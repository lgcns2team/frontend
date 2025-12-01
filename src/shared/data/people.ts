export interface HistoricalPerson {
    name: string;
    title: string;
    lat: number;
    lng: number;
    years: string;
    achievements: string;
}

export const peopleData: Record<string, HistoricalPerson[]> = {
    '0_300': [
        { name: '동명성왕', title: '고구려 시조', lat: 41.1, lng: 126.2, years: 'BC 37', achievements: '고구려 건국' },
        { name: '온조왕', title: '백제 시조', lat: 37.5, lng: 127.0, years: 'BC 18', achievements: '백제 건국' }
    ],
    '300_500': [
        { name: '근초고왕', title: '백제 제13대 왕', lat: 37.5, lng: 127.0, years: '346-375', achievements: '백제 전성기' },
        { name: '광개토대왕', title: '고구려 제19대 왕', lat: 41.1, lng: 126.2, years: '391-413', achievements: '영토 확장' },
        { name: '장수왕', title: '고구려 제20대 왕', lat: 39.0, lng: 125.7, years: '413-491', achievements: '평양 천도, 백제 압박' }
    ],
    '500_700': [
        { name: '을지문덕', title: '고구려 장군', lat: 39.7, lng: 125.4, years: '?-?', achievements: '살수대첩 승리' },
        { name: '김유신', title: '신라 장군', lat: 35.8, lng: 129.2, years: '595-673', achievements: '삼국통일 공신' },
        { name: '계백', title: '백제 장군', lat: 36.0, lng: 127.1, years: '?-660', achievements: '황산벌 항전' }
    ],
    '700_900': [
        { name: '대조영', title: '발해 건국자', lat: 44.0, lng: 129.5, years: '?-719', achievements: '발해 건국' },
        { name: '장보고', title: '청해진 대사', lat: 34.3, lng: 126.7, years: '?-846', achievements: '해상무역 장악' }
    ],
    '900_1100': [
        { name: '왕건', title: '고려 태조', lat: 37.9, lng: 126.6, years: '877-943', achievements: '고려 건국, 후삼국 통일' },
        { name: '서희', title: '고려 문신', lat: 38.9, lng: 125.2, years: '942-998', achievements: '강동6주 획득' },
        { name: '강감찬', title: '고려 장군', lat: 38.9, lng: 125.2, years: '948-1031', achievements: '귀주대첩 승리' }
    ],
    '1100_1300': [
        { name: '김부식', title: '고려 문신', lat: 37.9, lng: 126.6, years: '1075-1151', achievements: '삼국사기 편찬' },
        { name: '김윤후', title: '고려 승려', lat: 37.2, lng: 127.4, years: '?-?', achievements: '처인성에서 몽골 살리타 사살' }
    ],
    '1300_1400': [
        { name: '이성계', title: '조선 태조', lat: 37.57, lng: 126.98, years: '1335-1408', achievements: '조선 건국' },
        { name: '정몽주', title: '고려 충신', lat: 37.9, lng: 126.6, years: '1337-1392', achievements: '고려 충절' }
    ],
    '1400_1600': [
        { name: '세종대왕', title: '조선 제4대 왕', lat: 37.57, lng: 126.98, years: '1397-1450', achievements: '한글 창제, 과학 발전' },
        { name: '이순신', title: '조선 장군', lat: 34.8, lng: 128.4, years: '1545-1598', achievements: '임진왜란 수군 승리' }
    ],
    '1600_1800': [
        { name: '정약용', title: '조선 실학자', lat: 37.57, lng: 126.98, years: '1762-1836', achievements: '실학 집대성' }
    ],
    '1800_1900': [
        { name: '김구', title: '독립운동가', lat: 37.57, lng: 126.98, years: '1876-1949', achievements: '대한민국 임시정부 주석' }
    ],
    '1900_1945': [
        { name: '안중근', title: '독립운동가', lat: 43.8, lng: 125.3, years: '1879-1910', achievements: '이토 히로부미 처단' }
    ]
};

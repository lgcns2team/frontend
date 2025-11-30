export interface TradeRoute {
    name: string;
    route: string;
    lat: number;
    lng: number;
    goods: string[];
    from: { name: string; lat: number; lng: number };
    to: { name: string; lat: number; lng: number };
    bidirectional: boolean;
    waypoints?: { name: string; lat: number; lng: number }[];
}

export const tradeData: Record<string, TradeRoute[]> = {
    '0_300': [
        {
            name: '실크로드', route: '장안-중앙아시아', lat: 34.3, lng: 108.9, goods: ['비단', '도자기', '향료'],
            from: { name: '장안', lat: 34.3, lng: 108.9 }, to: { name: '중앙아시아', lat: 40.0, lng: 65.0 }, bidirectional: true
        }
    ],
    '300_500': [
        {
            name: '낙랑무역', route: '낙랑-한반도', lat: 39.0, lng: 125.7, goods: ['철기', '직물', '칠기'],
            from: { name: '낙랑', lat: 39.0, lng: 125.7 }, to: { name: '한반도남부', lat: 36.0, lng: 127.5 }, bidirectional: true
        }
    ],
    '500_700': [
        {
            name: '신라-당 무역', route: '경주-당나라', lat: 35.8, lng: 129.2, goods: ['금', '은', '직물', '불상'],
            from: { name: '경주', lat: 35.8, lng: 129.2 }, to: { name: '장안', lat: 34.3, lng: 108.9 }, bidirectional: true
        }
    ],
    '700_900': [
        {
            name: '장보고 해상무역', route: '완도-당-일본', lat: 34.3, lng: 126.7, goods: ['도자기', '차', '직물', '노예'],
            from: { name: '완도', lat: 34.3, lng: 126.7 }, to: { name: '당나라', lat: 34.3, lng: 108.9 },
            waypoints: [{ name: '일본', lat: 35.0, lng: 135.7 }], bidirectional: true
        }
    ],
    '900_1100': [
        {
            name: '고려-송 무역', route: '개경-송나라', lat: 37.9, lng: 126.6, goods: ['인삼', '종이', '붓', '먹'],
            from: { name: '개경', lat: 37.9, lng: 126.6 }, to: { name: '송나라', lat: 30.3, lng: 120.2 }, bidirectional: true
        }
    ],
    '1100_1300': [
        {
            name: '고려청자 수출', route: '벽란도-송원', lat: 37.7, lng: 126.7, goods: ['청자', '고려인삼', '나전칠기'],
            from: { name: '벽란도', lat: 37.7, lng: 126.7 }, to: { name: '송원', lat: 31.0, lng: 121.0 }, bidirectional: false
        }
    ],
    '1300_1400': [
        {
            name: '원-고려 무역', route: '개경-대도', lat: 37.9, lng: 126.6, goods: ['면직물', '화약', '금속활자'],
            from: { name: '개경', lat: 37.9, lng: 126.6 }, to: { name: '대도', lat: 39.9, lng: 116.4 }, bidirectional: true
        }
    ],
    '1400_1600': [
        {
            name: '조선-명 조공무역', route: '한성-북경', lat: 37.57, lng: 126.98, goods: ['인삼', '종이', '말', '은'],
            from: { name: '한성', lat: 37.57, lng: 126.98 }, to: { name: '북경', lat: 39.9, lng: 116.4 }, bidirectional: false
        }
    ],
    '1600_1800': [
        {
            name: '조선-청 무역', route: '한양-북경', lat: 37.57, lng: 126.98, goods: ['인삼', '종이', '직물'],
            from: { name: '한양', lat: 37.57, lng: 126.98 }, to: { name: '북경', lat: 39.9, lng: 116.4 }, bidirectional: false
        },
        {
            name: '남만무역', route: '나가사키-동남아', lat: 32.7, lng: 129.9, goods: ['은', '구리', '도자기'],
            from: { name: '나가사키', lat: 32.7, lng: 129.9 }, to: { name: '동남아', lat: 13.7, lng: 100.5 }, bidirectional: true
        }
    ],
    '1800_1900': [
        {
            name: '개항장 무역', route: '부산-일본', lat: 35.1, lng: 129.0, goods: ['쌀', '콩', '직물', '기계'],
            from: { name: '부산', lat: 35.1, lng: 129.0 }, to: { name: '나가사키', lat: 32.7, lng: 129.9 }, bidirectional: true
        }
    ],
    '1900_1945': [
        {
            name: '경부선 물류', route: '부산-서울', lat: 36.0, lng: 128.0, goods: ['쌀', '석탄', '철강'],
            from: { name: '부산', lat: 35.1, lng: 129.0 }, to: { name: '서울', lat: 37.57, lng: 126.98 }, bidirectional: true
        }
    ]
};

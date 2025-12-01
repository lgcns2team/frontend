export interface Capital {
    name: string;
    capital: string;
    lat: number;
    lng: number;
    country: string;
}

export const capitalData: Record<string, Capital[]> = {
    // BC 시대
    '-2000_-1000': [
        { name: '상(商)', capital: '은허', lat: 36.1, lng: 114.3, country: '중국 상나라' },
        { name: '고조선', capital: '왕검성(추정)', lat: 39.0, lng: 125.7, country: '고조선' }
    ],
    '-1000_-500': [
        { name: '주(周)', capital: '호경', lat: 34.3, lng: 108.9, country: '중국 주나라' },
        { name: '고조선', capital: '왕검성', lat: 39.0, lng: 125.7, country: '고조선' }
    ],
    '-500_0': [
        { name: '진(秦)', capital: '함양', lat: 34.3, lng: 108.7, country: '중국 진나라' },
        { name: '고조선', capital: '왕검성', lat: 39.0, lng: 125.7, country: '고조선' }
    ],
    // 기원후 ~ 삼국시대
    '0_300': [
        { name: '한(漢)', capital: '장안', lat: 34.3, lng: 108.9, country: '중국 한나라' },
        { name: '고구려', capital: '국내성', lat: 41.1, lng: 126.2, country: '고구려' },
        { name: '백제', capital: '위례성', lat: 37.5, lng: 127.0, country: '백제' },
        { name: '신라', capital: '서라벌', lat: 35.8, lng: 129.2, country: '신라' }
    ],
    '300_500': [
        { name: '진(晉)', capital: '낙양', lat: 34.6, lng: 112.4, country: '중국 진나라' },
        { name: '고구려', capital: '국내성', lat: 41.1, lng: 126.2, country: '고구려' },
        { name: '백제', capital: '한성', lat: 37.5, lng: 127.0, country: '백제' },
        { name: '신라', capital: '경주', lat: 35.8, lng: 129.2, country: '신라' }
    ],
    '500_700': [
        { name: '수/당', capital: '장안', lat: 34.3, lng: 108.9, country: '중국 수당' },
        { name: '고구려', capital: '평양', lat: 39.0, lng: 125.7, country: '고구려' },
        { name: '백제', capital: '사비(부여)', lat: 36.3, lng: 126.9, country: '백제' },
        { name: '신라', capital: '경주', lat: 35.8, lng: 129.2, country: '신라' }
    ],
    '700_900': [
        { name: '당', capital: '장안', lat: 34.3, lng: 108.9, country: '중국 당나라' },
        { name: '신라', capital: '경주', lat: 35.8, lng: 129.2, country: '통일신라' },
        { name: '발해', capital: '상경', lat: 44.0, lng: 129.5, country: '발해' },
        { name: '일본', capital: '헤이안쿄', lat: 35.0, lng: 135.7, country: '일본' }
    ],
    '900_1100': [
        { name: '송', capital: '개봉', lat: 34.8, lng: 114.3, country: '중국 송나라' },
        { name: '고려', capital: '개경', lat: 37.9, lng: 126.6, country: '고려' },
        { name: '일본', capital: '교토', lat: 35.0, lng: 135.7, country: '일본' }
    ],
    '1100_1300': [
        { name: '금/원', capital: '대도(북경)', lat: 39.9, lng: 116.4, country: '중국 원나라' },
        { name: '고려', capital: '개경', lat: 37.9, lng: 126.6, country: '고려' },
        { name: '일본', capital: '교토', lat: 35.0, lng: 135.7, country: '일본' }
    ],
    '1300_1400': [
        { name: '명', capital: '남경', lat: 32.0, lng: 118.8, country: '중국 명나라' },
        { name: '고려', capital: '개경', lat: 37.9, lng: 126.6, country: '고려' },
        { name: '일본', capital: '교토', lat: 35.0, lng: 135.7, country: '일본' }
    ],
    '1400_1600': [
        { name: '명', capital: '북경', lat: 39.9, lng: 116.4, country: '중국 명나라' },
        { name: '조선', capital: '한성', lat: 37.57, lng: 126.98, country: '조선' },
        { name: '일본', capital: '교토', lat: 35.0, lng: 135.7, country: '일본' }
    ],
    '1600_1800': [
        { name: '청', capital: '북경', lat: 39.9, lng: 116.4, country: '중국 청나라' },
        { name: '조선', capital: '한양', lat: 37.57, lng: 126.98, country: '조선' },
        { name: '일본', capital: '에도', lat: 35.7, lng: 139.7, country: '일본(에도시대)' }
    ],
    '1800_1900': [
        { name: '청', capital: '북경', lat: 39.9, lng: 116.4, country: '중국 청나라' },
        { name: '조선', capital: '한성', lat: 37.57, lng: 126.98, country: '조선' },
        { name: '일본', capital: '도쿄', lat: 35.7, lng: 139.7, country: '일본(메이지)' }
    ],
    '1900_1945': [
        { name: '중화민국', capital: '북경/남경', lat: 39.9, lng: 116.4, country: '중화민국' },
        { name: '대한제국', capital: '한성', lat: 37.57, lng: 126.98, country: '대한제국' },
        { name: '일본', capital: '도쿄', lat: 35.7, lng: 139.7, country: '일본제국' }
    ],
    '1945_2024': [
        { name: '중국', capital: '북경', lat: 39.9, lng: 116.4, country: '중화인민공화국' },
        { name: '대한민국', capital: '서울', lat: 37.57, lng: 126.98, country: '대한민국' },
        { name: '조선민주주의인민공화국', capital: '평양', lat: 39.0, lng: 125.7, country: '북한' },
        { name: '일본', capital: '도쿄', lat: 35.7, lng: 139.7, country: '일본' }
    ]
};

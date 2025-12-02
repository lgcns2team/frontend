export interface TroopMovement {
    name: string;
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
    type: 'land' | 'sea';
    waypoints?: { lat: number; lng: number }[];
}

export interface Battle {
    name: string;
    year: number;
    lat: number;
    lng: number;
    participants: string[];
    outcome: string;
    troops?: { attacker: TroopMovement };
    war?: string;
}

export const battleData: Record<string, Battle[]> = {
    '0_300': [
        { name: '적벽대전', year: 208, lat: 30.2, lng: 113.9, participants: ['조조', '손권', '유비'], outcome: '손유연합 승리' }
    ],
    '300_500': [
        { name: '비수대전', year: 383, lat: 33.0, lng: 117.0, participants: ['동진', '전진'], outcome: '동진 승리' },
        { name: '평양성 전투', year: 427, lat: 39.0, lng: 125.7, participants: ['고구려', '북연'], outcome: '고구려 승리' },
        {
            name: '관미성 전투', year: 475, lat: 37.4, lng: 127.1, participants: ['고구려', '백제'], outcome: '고구려 승리',
            troops: { attacker: { name: '고구려군', from: { lat: 39.0, lng: 125.7 }, to: { lat: 37.4, lng: 127.1 }, type: 'land' } }
        }
    ],
    '500_700': [
        {
            name: '살수대첩', year: 612, lat: 39.7, lng: 125.4, participants: ['고구려', '수나라'], outcome: '고구려 대승',
            troops: {
                attacker: {
                    name: '수나라군', from: { lat: 40.5, lng: 116.4 }, to: { lat: 39.7, lng: 125.4 }, type: 'land',
                    waypoints: [
                        { lat: 40.6, lng: 117.0 }, { lat: 40.7, lng: 118.0 }, { lat: 40.8, lng: 119.0 }, // 산해관 북쪽
                        { lat: 41.0, lng: 120.0 }, { lat: 41.2, lng: 121.0 }, { lat: 41.5, lng: 122.0 }, // 요동반도 북부
                        { lat: 41.6, lng: 123.0 }, { lat: 41.5, lng: 124.0 }, { lat: 41.3, lng: 124.8 }, // 요양
                        { lat: 40.8, lng: 125.2 }, { lat: 40.3, lng: 125.3 }, { lat: 39.9, lng: 125.4 }  // 압록강→평양
                    ]
                }
            }
        },
        {
            name: '황산벌 전투', year: 660, lat: 36.0, lng: 127.1, participants: ['신라당연합', '백제'], outcome: '신라당 승리',
            troops: {
                attacker: {
                    name: '신라군', from: { lat: 35.8, lng: 129.2 }, to: { lat: 36.0, lng: 127.1 }, type: 'land',
                    waypoints: [{ lat: 35.85, lng: 129.0 }, { lat: 35.9, lng: 128.5 }, { lat: 35.93, lng: 128.0 }, { lat: 35.95, lng: 127.8 }, { lat: 35.97, lng: 127.5 }, { lat: 35.98, lng: 127.3 }]
                }
            }
        },
        {
            name: '안시성 전투', year: 645, lat: 40.5, lng: 124.3, participants: ['고구려', '당나라'], outcome: '고구려 승리',
            troops: {
                attacker: {
                    name: '당나라군', from: { lat: 40.0, lng: 116.4 }, to: { lat: 40.5, lng: 124.3 }, type: 'land',
                    waypoints: [
                        { lat: 40.6, lng: 117.0 }, { lat: 40.7, lng: 118.0 }, { lat: 40.8, lng: 119.0 }, // 산해관 북쪽
                        { lat: 41.0, lng: 120.0 }, { lat: 41.2, lng: 121.0 }, { lat: 41.4, lng: 122.0 }, // 요동반도 북부
                        { lat: 41.3, lng: 123.0 }, { lat: 41.0, lng: 123.8 }, { lat: 40.7, lng: 124.2 }  // 요양→안시성
                    ]
                }
            }
        },
        { name: '백강 전투', year: 663, lat: 37.8, lng: 126.6, participants: ['신라당연합', '백제왜연합'], outcome: '신라당 승리' }
    ],
    '700_900': [
        { name: '매초성 전투', year: 733, lat: 43.8, lng: 127.5, participants: ['발해', '당나라'], outcome: '발해 승리' }
    ],
    '900_1100': [
        {
            name: '귀주대첩', year: 1019, lat: 38.9, lng: 125.2, participants: ['고려', '거란'], outcome: '고려 대승',
            troops: {
                attacker: {
                    name: '거란군', from: { lat: 42.0, lng: 120.0 }, to: { lat: 38.9, lng: 125.2 }, type: 'land',
                    waypoints: [
                        { lat: 42.0, lng: 121.0 }, { lat: 42.0, lng: 122.0 }, { lat: 41.8, lng: 123.0 }, // 요동반도 북부
                        { lat: 41.6, lng: 123.8 }, { lat: 41.4, lng: 124.4 }, { lat: 41.2, lng: 124.8 }, // 요양
                        { lat: 40.8, lng: 125.1 }, { lat: 40.4, lng: 125.2 }, { lat: 40.0, lng: 125.2 }, // 압록강
                        { lat: 39.6, lng: 125.2 }, { lat: 39.3, lng: 125.2 }, { lat: 39.0, lng: 125.2 } // 평안도
                    ]
                }
            }
        }
    ],
    '1100_1300': [
        {
            name: '처인성 전투', year: 1232, lat: 37.2, lng: 127.4, participants: ['고려', '몽골'], outcome: '고려 승리',
            troops: {
                attacker: {
                    name: '몽골군', from: { lat: 40.0, lng: 116.4 }, to: { lat: 37.2, lng: 127.4 }, type: 'land',
                    waypoints: [
                        { lat: 40.5, lng: 117.0 }, { lat: 40.8, lng: 118.0 }, { lat: 41.0, lng: 119.0 }, // 산해관 북쪽
                        { lat: 41.2, lng: 120.0 }, { lat: 41.5, lng: 121.5 }, { lat: 41.6, lng: 123.0 }, // 요동반도 북부
                        { lat: 41.4, lng: 124.0 }, { lat: 41.0, lng: 124.8 }, { lat: 40.5, lng: 125.3 }, // 요양→압록강
                        { lat: 39.8, lng: 125.8 }, { lat: 39.0, lng: 126.3 }, { lat: 38.3, lng: 126.8 }, // 평안도→황해도
                        { lat: 37.8, lng: 127.1 }, { lat: 37.5, lng: 127.3 }  // 경기도
                    ]
                }
            }
        }
    ],
    '1300_1400': [
        { name: '홍건적의 난', year: 1361, lat: 37.9, lng: 127.7, participants: ['고려', '홍건적'], outcome: '고려 승리' }
    ],
    '1400_1600': [
        {
            name: '임진왜란', year: 1592, lat: 35.2, lng: 129.0, participants: ['조선', '일본', '명나라'], outcome: '조선명 승리',
            troops: { attacker: { name: '왜군', from: { lat: 33.5, lng: 130.5 }, to: { lat: 35.2, lng: 129.0 }, type: 'sea', waypoints: [{ lat: 34.0, lng: 129.5 }, { lat: 34.5, lng: 129.3 }] } }
        },
        {
            name: '한산도대첩', year: 1592, lat: 34.8, lng: 128.4, participants: ['조선수군', '일본수군'], outcome: '조선 대승',
            troops: { attacker: { name: '왜수군', from: { lat: 34.5, lng: 128.0 }, to: { lat: 34.8, lng: 128.4 }, type: 'sea' } }
        },
        {
            name: '한산도 대첩', year: 1592, lat: 34.8, lng: 128.4, participants: ['조선수군', '일본수군'], outcome: '조선 대승',
            troops: { attacker: { name: '왜수군', from: { lat: 34.5, lng: 128.0 }, to: { lat: 34.8, lng: 128.4 }, type: 'sea' } }
        },
        {
            name: '명량해전', year: 1597, lat: 34.5, lng: 126.3, participants: ['조선수군', '일본수군'], outcome: '조선 대승',
            troops: { attacker: { name: '왜수군', from: { lat: 34.3, lng: 126.5 }, to: { lat: 34.5, lng: 126.3 }, type: 'sea' } }
        },
        {
            name: '노량해전', year: 1598, lat: 34.6, lng: 128.0, participants: ['조선수군', '일본수군'], outcome: '조선 승리',
            troops: { attacker: { name: '왜수군', from: { lat: 34.4, lng: 128.2 }, to: { lat: 34.6, lng: 128.0 }, type: 'sea' } }
        },
        {
            name: '행주대첩', year: 1593, lat: 37.6, lng: 126.8, participants: ['조선', '일본'], outcome: '조선 승리',
            troops: { attacker: { name: '왜군', from: { lat: 37.5, lng: 127.0 }, to: { lat: 37.6, lng: 126.8 }, type: 'land' } }
        }
    ],
    '1600_1800': [
        {
            name: '병자호란', year: 1636, lat: 37.5, lng: 127.0, participants: ['조선', '청나라'], outcome: '청나라 승리',
            troops: {
                attacker: {
                    name: '청군', from: { lat: 40.0, lng: 116.4 }, to: { lat: 37.5, lng: 127.0 }, type: 'land',
                    waypoints: [
                        { lat: 40.5, lng: 117.5 }, { lat: 40.8, lng: 118.5 }, { lat: 41.0, lng: 119.5 }, // 산해관 북쪽
                        { lat: 41.3, lng: 121.0 }, { lat: 41.5, lng: 122.5 }, { lat: 41.4, lng: 123.8 }, // 요동반도 북부
                        { lat: 41.0, lng: 124.6 }, { lat: 40.5, lng: 125.2 }, { lat: 40.0, lng: 125.5 }, // 요양→압록강
                        { lat: 39.3, lng: 126.0 }, { lat: 38.5, lng: 126.5 }, { lat: 38.0, lng: 126.8 }  // 평안도→한성
                    ]
                }
            }
        },
        {
            name: '의주 전투', year: 1636, lat: 40.2, lng: 124.5, participants: ['조선', '청나라'], outcome: '청나라 승리', war: '병자호란',
            troops: { attacker: { name: '청군', from: { lat: 40.5, lng: 124.0 }, to: { lat: 40.2, lng: 124.5 }, type: 'land' } }
        },
        {
            name: '정주성 전투', year: 1636, lat: 39.7, lng: 125.2, participants: ['조선', '청나라'], outcome: '청나라 승리', war: '병자호란',
            troops: { attacker: { name: '청군', from: { lat: 40.2, lng: 124.5 }, to: { lat: 39.7, lng: 125.2 }, type: 'land' } }
        },
        {
            name: '안주성 전투', year: 1636, lat: 39.6, lng: 125.7, participants: ['조선', '청나라'], outcome: '청나라 승리', war: '병자호란',
            troops: { attacker: { name: '청군', from: { lat: 39.7, lng: 125.2 }, to: { lat: 39.6, lng: 125.7 }, type: 'land' } }
        },
        {
            name: '평양성 전투', year: 1636, lat: 39.0, lng: 125.8, participants: ['조선', '청나라'], outcome: '청나라 승리', war: '병자호란',
            troops: { attacker: { name: '청군', from: { lat: 39.6, lng: 125.7 }, to: { lat: 39.0, lng: 125.8 }, type: 'land' } }
        },
        {
            name: '황주 전투', year: 1637, lat: 38.6, lng: 125.8, participants: ['조선', '청나라'], outcome: '청나라 승리', war: '병자호란',
            troops: { attacker: { name: '청군', from: { lat: 39.0, lng: 125.8 }, to: { lat: 38.6, lng: 125.8 }, type: 'land' } }
        },
        {
            name: '남한산성 포위전', year: 1637, lat: 37.48, lng: 127.18, participants: ['조선', '청나라'], outcome: '청나라 승리', war: '병자호란',
            troops: { attacker: { name: '청군', from: { lat: 37.5, lng: 127.0 }, to: { lat: 37.48, lng: 127.18 }, type: 'land' } }
        },
        {
            name: '쌍령 전투', year: 1637, lat: 37.7, lng: 127.3, participants: ['조선', '청나라'], outcome: '청나라 승리', war: '병자호란',
            troops: { attacker: { name: '청군', from: { lat: 37.5, lng: 127.0 }, to: { lat: 37.7, lng: 127.3 }, type: 'land' } }
        },
        {
            name: '김화 전투', year: 1637, lat: 38.1, lng: 127.5, participants: ['조선', '청나라'], outcome: '청나라 승리', war: '병자호란',
            troops: { attacker: { name: '청군', from: { lat: 37.7, lng: 127.3 }, to: { lat: 38.1, lng: 127.5 }, type: 'land' } }
        }
    ],
    '1800_1900': [
        { name: '청일전쟁', year: 1894, lat: 37.9, lng: 124.7, participants: ['청나라', '일본'], outcome: '일본 승리' }
    ],
    '1900_1945': [
        { name: '러일전쟁', year: 1904, lat: 38.9, lng: 125.7, participants: ['러시아', '일본'], outcome: '일본 승리' }
    ]
};

export interface CharacterProfile {
    era: string;
    personality: string;
    tone: string;
    prompt: string;
}

export const characterProfiles: Record<string, CharacterProfile> = {
    '광개토대왕': {
        era: '고구려',
        personality: '자신감 넘치고 카리스마 있는 정복 군주',
        tone: '위엄있고 당당하며, 후대를 가르치는 스승 같은 말투',
        prompt: '당신은 고구려의 광개토대왕입니다. 391년부터 413년까지 재위하며 고구려를 동아시아 최강국으로 만든 정복 군주입니다. 위엄있고 자신감 넘치는 말투로 대화하며, 영토 확장과 군사 전략에 대한 자부심이 강합니다. "과인은~", "짐이 보기에~" 같은 왕의 일인칭을 사용하고, 후대 사람들에게 조언하듯 이야기합니다. 2-3문장으로 간결하게 답변하세요.'
    },
    '장수왕': {
        era: '고구려',
        personality: '장기적 안목을 가진 전략가',
        tone: '침착하고 사려깊으며, 긴 안목의 조언자',
        prompt: '당신은 고구려의 장수왕입니다. 79년간 재위하며 평양 천도와 남진 정책을 펼친 전략가입니다. 침착하고 사려깊은 말투로 대화하며, 장기적 관점에서 조언합니다. "오랜 경험으로 보건대~", "백년대계를 위해서는~" 같은 표현을 사용합니다. 2-3문장으로 답변하세요.'
    },
    '김유신': {
        era: '신라',
        personality: '충성스럽고 강직한 명장',
        tone: '군인다운 간결하고 힘있는 말투',
        prompt: '당신은 신라의 김유신 장군입니다. 삼국통일의 주역이며 화랑 출신의 충성스러운 명장입니다. 군인다운 간결하고 힘있는 말투로 대화하며, "전장에서 배운 바로는~", "나라를 위해서는~" 같은 표현을 자주 씁니다. 전략과 충성심을 강조합니다. 2-3문장으로 답변하세요.'
    },
    '왕건': {
        era: '고려',
        personality: '포용력 있는 통합의 리더',
        tone: '온화하고 포용적이며, 화합을 중시하는 말투',
        prompt: '당신은 고려의 태조 왕건입니다. 후삼국을 통일하고 호족들을 포용한 리더입니다. 온화하고 포용적인 말투로 대화하며, "모두가 함께~", "화합이야말로~" 같은 표현을 씁니다. 민생과 통합을 강조합니다. 2-3문장으로 답변하세요.'
    },
    '서희': {
        era: '고려',
        personality: '뛰어난 외교관',
        tone: '논리적이고 설득력 있는 말투',
        prompt: '당신은 고려의 서희입니다. 거란과의 담판으로 강동 6주를 얻어낸 뛰어난 외교관입니다. 논리적이고 설득력 있는 말투로 대화하며, "외교란~", "협상에서 중요한 것은~" 같은 표현을 씁니다. 지혜와 말의 힘을 강조합니다. 2-3문장으로 답변하세요.'
    },
    '이성계': {
        era: '조선',
        personality: '무장 출신의 개혁가',
        tone: '결단력 있고 개혁적인 말투',
        prompt: '당신은 조선의 태조 이성계입니다. 무장 출신으로 새 왕조를 세운 개혁가입니다. 결단력 있고 개혁적인 말투로 대화하며, "새 시대를 위해서는~", "구습을 타파하고~" 같은 표현을 씁니다. 변화와 개혁을 강조합니다. 2-3문장으로 답변하세요.'
    },
    '세종대왕': {
        era: '조선',
        personality: '학문을 사랑하는 성군',
        tone: '따뜻하고 지혜로우며, 백성을 생각하는 말투',
        prompt: '당신은 조선의 세종대왕입니다. 한글을 창제하고 과학과 문화를 발전시킨 성군입니다. 따뜻하고 지혜로운 말투로 대화하며, "백성을 위하여~", "학문이란~" 같은 표현을 씁니다. 백성 사랑과 지식의 중요성을 강조합니다. 2-3문장으로 답변하세요.'
    },
    '이순신': {
        era: '조선',
        personality: '불굴의 의지를 가진 명장',
        tone: '굳건하고 결연한 군인의 말투',
        prompt: '당신은 조선의 이순신 장군입니다. 임진왜란 때 나라를 구한 불굴의 명장입니다. 굳건하고 결연한 말투로 대화하며, "필사즉생 필생즉사", "신에게는 아직 12척의 배가 있습니다" 같은 불굴의 의지를 보여줍니다. 충성과 책임감을 강조합니다. 2-3문장으로 답변하세요.'
    },
    '정약용': {
        era: '조선',
        personality: '실학자이자 개혁 사상가',
        tone: '논리적이고 실용적인 지식인의 말투',
        prompt: '당신은 조선의 정약용입니다. 실학을 집대성한 개혁 사상가입니다. 논리적이고 실용적인 말투로 대화하며, "실용이 중요하네", "백성의 실생활에~" 같은 표현을 씁니다. 실사구시와 개혁을 강조합니다. 2-3문장으로 답변하세요.'
    },
    '김구': {
        era: '근대',
        personality: '독립운동의 지도자',
        tone: '열정적이고 민족애가 넘치는 말투',
        prompt: '당신은 백범 김구 선생입니다. 평생을 독립운동에 바친 지도자입니다. 열정적이고 민족애가 넘치는 말투로 대화하며, "나의 소원은 독립이오", "민족을 위해~" 같은 표현을 씁니다. 독립과 평화통일을 강조합니다. 2-3문장으로 답변하세요.'
    },
    '안중근': {
        era: '근대',
        personality: '의기있는 독립투사',
        tone: '정의롭고 강직한 애국자의 말투',
        prompt: '당신은 안중근 의사입니다. 이토 히로부미를 처단한 독립투사입니다. 정의롭고 강직한 말투로 대화하며, "동양평화를 위하여", "의로운 일이라면~" 같은 표현을 씁니다. 정의와 평화를 강조합니다. 2-3문장으로 답변하세요.'
    },
    '유관순': {
        era: '근대',
        personality: '용감한 독립운동가',
        tone: '용기있고 당당한 젊은 애국자의 말투',
        prompt: '당신은 유관순 열사입니다. 3.1운동을 이끈 용감한 독립운동가입니다. 용기있고 당당한 말투로 대화하며, "독립만세를 외치며~", "용기를 내세요" 같은 표현을 씁니다. 희생정신과 용기를 강조합니다. 2-3문장으로 답변하세요.'
    }
};

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

export const seaRegions = {
    yellowSea: { minLat: 34.0, maxLat: 40.0, minLng: 119.5, maxLng: 126.0 },
    seaOfJapan: { minLat: 35.0, maxLat: 43.0, minLng: 128.5, maxLng: 142.0 },
    southSea: { minLat: 32.0, maxLat: 35.5, minLng: 125.5, maxLng: 130.0 },
    bohaiSea: { minLat: 37.5, maxLat: 41.0, minLng: 117.5, maxLng: 122.0 }
};

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

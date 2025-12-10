import { useEffect, useState, type ReactNode } from 'react';
// import { fetchCharacters, type ParsedCharacter } from '../../../shared/api/characters-api';
import type { ParsedCharacter } from '../../../shared/api/characters-api';
import { getEraForYear, ERAS } from '../../../shared/config/era-theme';
import './CharactersPanel.css';

// 개발용 더미 데이터
const DUMMY_CHARACTERS: ParsedCharacter[] = [
    {
        characterId: '1',
        characterName: '광개토대왕',
        birthYear: 374,
        deathYear: 413,
        era: 'three-kingdoms',
        summary: '고구려의 제19대 왕으로 영토를 크게 확장',
        imagePath: '/assets/images/character/kwang.png'
    },
    {
        characterId: '2',
        characterName: '을지문덕',
        birthYear: 550,
        deathYear: 618,
        era: 'three-kingdoms',
        summary: '살수대첩에서 수나라 대군을 격퇴',
        imagePath: '/assets/images/character/elji.png'
    },
    {
        characterId: '3',
        characterName: '김유신',
        birthYear: 595,
        deathYear: 673,
        era: 'three-kingdoms',
        summary: '삼국통일의 주역이며, 화랑출신',
        imagePath: '/assets/images/character/kimyusin.png'
    },
    {
        characterId: '4',
        characterName: '선덕여왕',
        birthYear: 606,
        deathYear: 647,
        era: 'three-kingdoms',
        summary: '신라 최초의 여왕이자 동아시아 최초의 여성 군주',
        imagePath: '/assets/images/character/kwang.png'
    },
    {
        characterId: '5',
        characterName: '대조영',
        birthYear: 698,
        deathYear: 719,
        era: 'north-south-states',
        summary: '발해의 건국자이자 초대 왕',
        imagePath: '/assets/images/character/elji.png'
    },
    {
        characterId: '6',
        characterName: '장보고',
        birthYear: 790,
        deathYear: 846,
        era: 'north-south-states',
        summary: '신라 하대의 해상왕으로 청해진을 설치',
        imagePath: '/assets/images/character/kimyusin.png'
    },
    {
        characterId: '7',
        characterName: '왕건',
        birthYear: 877,
        deathYear: 943,
        era: 'goryeo',
        summary: '고려의 건국자이자 태조로, 후삼국을 통일',
        imagePath: '/assets/images/character/kwang.png'
    },
    {
        characterId: '8',
        characterName: '서희',
        birthYear: 942,
        deathYear: 998,
        era: 'goryeo',
        summary: '거란의 소손녕과의 담판으로 강동 6주를 확보',
        imagePath: '/assets/images/character/elji.png'
    },
    {
        characterId: '9',
        characterName: '강감찬',
        birthYear: 948,
        deathYear: 1031,
        era: 'goryeo',
        summary: '귀주대첩에서 거란군을 크게 격파',
        imagePath: '/assets/images/character/kimyusin.png'
    },
    {
        characterId: '10',
        characterName: '세종대왕',
        birthYear: 1397,
        deathYear: 1450,
        era: 'joseon',
        summary: '한글을 창제하고 과학기술과 문화를 크게 발전',
        imagePath: '/assets/images/character/kwang.png'
    },
    {
        characterId: '11',
        characterName: '신사임당',
        birthYear: 1504,
        deathYear: 1551,
        era: 'joseon',
        summary: '조선시대 여류예술가이자 학자',
        imagePath: '/assets/images/character/elji.png'
    },
    {
        characterId: '12',
        characterName: '이순신',
        birthYear: 1545,
        deathYear: 1598,
        era: 'joseon',
        summary: '임진왜란 때 23전 23승의 불패신화를 기록',
        imagePath: '/assets/images/character/kimyusin.png'
    },
    {
        characterId: '13',
        characterName: '정약용',
        birthYear: 1762,
        deathYear: 1836,
        era: 'joseon',
        summary: '500여 권의 저서를 남기며 개혁사상과 과학기술을 발전',
        imagePath: '/assets/images/character/kwang.png'
    },
    {
        characterId: '14',
        characterName: '안중근',
        birthYear: 1879,
        deathYear: 1910,
        era: 'korean-empire',
        summary: '독립운동가로 하얼빈역에서 이토 히로부미를 처단',
        imagePath: '/assets/images/character/elji.png'
    }
];

interface CharactersPanelProps {
    onYearChange?: (year: number) => void;
    onCharacterClick?: (character: ParsedCharacter) => void;
    currentYear?: number;
    renderToggle?: (toggleElement: ReactNode) => void;
}

export const CharactersPanel = ({ onYearChange, onCharacterClick, currentYear = 1244, renderToggle }: CharactersPanelProps) => {
    const [characters, setCharacters] = useState<ParsedCharacter[]>([]);
    const [showAll, setShowAll] = useState(true); // true: 전체, false: 현재 시대만
    // const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 백엔드 API 호출 부분 주석 처리
        // const loadCharacters = async () => {
        //     const data = await fetchCharacters();
        //     // Sort by birthYear ascending
        //     const sorted = data.sort((a, b) => {
        //         if (a.birthYear === null) return 1;
        //         if (b.birthYear === null) return -1;
        //         return a.birthYear - b.birthYear;
        //     });
        //     setCharacters(sorted);
        //     setLoading(false);
        // };
        // loadCharacters();

        // 더미 데이터 사용
        setCharacters(DUMMY_CHARACTERS);
    }, []);

    // Toggle element 생성
    useEffect(() => {
        if (renderToggle) {
            const toggleElement = (
                <div className="filter-toggle-container-header">
                    <span className="toggle-label">현재 시대</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={showAll}
                            onChange={(e) => setShowAll(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <span className="toggle-label">전체</span>
                </div>
            );
            renderToggle(toggleElement);
        }
    }, [showAll, renderToggle]);

    // if (loading) {
    //     return <div className="characters-loading">로딩 중...</div>;
    // }

    const handleCharacterClick = (character: ParsedCharacter) => {
        if (character.birthYear) {
            onYearChange?.(character.birthYear);
        }
        onCharacterClick?.(character);
    };

    // 현재 시대 정보 가져오기
    const currentEra = getEraForYear(currentYear);

    // 현재 시대에 해당하는 인물 필터링 (era-theme 기준)
    const filteredCharacters = showAll
        ? characters
        : characters.filter(character => {
            if (!character.birthYear || !character.deathYear) return false;
            // 인물이 현재 시대 동안 생존했는지 확인
            // 인물의 생애가 시대와 겹치는 경우를 포함
            return character.birthYear <= currentEra.endYear && character.deathYear >= currentEra.startYear;
        });

    return (
        <div className="characters-panel">
            <div className="characters-list">
                {filteredCharacters.map((character) => {
                    // 인물의 era 데이터를 기준으로 시대 프레임 가져오기
                    const characterEra = character.era ? ERAS.find(e => e.id === character.era) : undefined;
                    const characterEraFrame = characterEra?.frameImage;

                    return (
                        <div
                            key={character.characterId}
                            className="character-item"
                            onClick={() => handleCharacterClick(character)}
                            style={{
                                cursor: 'pointer',
                                ...(characterEraFrame && {
                                    '--character-frame-image': `url(${characterEraFrame})`
                                } as React.CSSProperties)
                            }}
                        >
                            {character.imagePath && (
                                <img
                                    src={character.imagePath}
                                    alt={character.characterName}
                                    className="character-image"
                                />
                            )}
                            <h3 className="character-name">{character.characterName}</h3>
                            {character.summary && (
                                <p className="character-summary">{character.summary}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

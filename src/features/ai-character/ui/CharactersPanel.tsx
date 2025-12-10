import { useEffect, useState, type ReactNode } from 'react';
import { fetchCharacters, fetchCharacterDetail, type ParsedCharacter } from '../../../shared/api/characters-api';
import { getEraForYear, ERAS } from '../../../shared/config/era-theme';
import './CharactersPanel.css';

interface CharactersPanelProps {
    onYearChange?: (year: number) => void;
    onCharacterClick?: (character: ParsedCharacter) => void;
    currentYear?: number;
    renderToggle?: (toggleElement: ReactNode) => void;
}

export const CharactersPanel = ({ onYearChange, onCharacterClick, currentYear = 1244, renderToggle }: CharactersPanelProps) => {
    const [characters, setCharacters] = useState<ParsedCharacter[]>([]);
    const [showAll, setShowAll] = useState(false); // true: 전체, false: 현재 시대만
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadCharacters = async () => {
            try {
                console.log("Fetching characters...");
                setError(null);
                const data = await fetchCharacters();
                console.log("Fetched characters data:", data);
                // Sort by birthYear ascending
                const sorted = data.sort((a, b) => {
                    if (a.birthYear === null) return 1;
                    if (b.birthYear === null) return -1;
                    return a.birthYear - b.birthYear;
                });
                setCharacters(sorted);
            } catch (error) {
                console.error("Failed to load characters", error);
                setError("데이터를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };
        loadCharacters();
    }, []);

    // 상세 정보(summary) 로딩 - 이름이 뜬 후에 백그라운드에서 로딩
    useEffect(() => {
        const fetchDetails = async () => {
            // summary가 없고 promptId가 있는 캐릭터들만 대상
            const charsToFetch = characters.filter(c => c.promptId && !c.summary);

            if (charsToFetch.length === 0) return;

            console.log("Fetching details for:", charsToFetch.length, "characters");

            // 한 번에 모든 상세 정보를 요청 (병렬 처리)
            const updates = await Promise.all(
                charsToFetch.map(async (char) => {
                    if (!char.promptId) return null;
                    const detail = await fetchCharacterDetail(char.promptId);
                    if (detail.summary) {
                        return { characterId: char.characterId, summary: detail.summary };
                    }
                    return null;
                })
            );

            const validUpdates = updates.filter((u): u is { characterId: string; summary: string } => u !== null);

            if (validUpdates.length > 0) {
                setCharacters(prev => prev.map(char => {
                    const update = validUpdates.find(u => u.characterId === char.characterId);
                    return update ? { ...char, summary: update.summary } : char;
                }));
            }
        };

        // characters가 로드되고 나서 실행 (loading이 false일 때)
        if (!loading && characters.length > 0) {
            fetchDetails();
        }
    }, [characters, loading]);

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

    if (loading) {
        return <div className="characters-loading">로딩 중...</div>;
    }

    if (error) {
        return <div className="characters-loading">{error}</div>;
    }

    if (characters.length === 0) {
        return <div className="characters-loading">표시할 인물이 없습니다.</div>;
    }

    const handleCharacterClick = (character: ParsedCharacter) => {
        if (character.birthYear) {
            let targetYear = character.birthYear;

            // 해당 시대의 시작 연도보다 이전인지 확인하여 제한
            if (character.era) {
                const eraConfig = ERAS.find(e => e.id === character.era);
                // -Infinity는 제외하고 체크
                if (eraConfig && eraConfig.startYear !== -Infinity && targetYear < eraConfig.startYear) {
                    targetYear = eraConfig.startYear;
                }
            }

            onYearChange?.(targetYear);
        }
        onCharacterClick?.(character);
    };

    // 현재 시대 정보 가져오기
    const currentEra = getEraForYear(currentYear);

    // 현재 시대에 해당하는 인물 필터링 (era 데이터 기준)
    const filteredCharacters = showAll
        ? characters
        : characters.filter(character => {
            // 인물의 era가 현재 연도의 era와 일치하는지 확인
            return character.era === currentEra.id;
        });

    return (
        <div className="characters-panel">
            {filteredCharacters.length === 0 ? (
                <div className="characters-loading">해당 시대의 인물이 없습니다.</div>
            ) : (
                <div className="characters-list">
                    {filteredCharacters.map((character, index) => {
                        // 인물의 era 데이터를 기준으로 시대 프레임 가져오기
                        const characterEra = character.era ? ERAS.find(e => e.id === character.era) : undefined;
                        const characterEraFrame = characterEra?.frameImage;

                        return (
                            <div
                                key={`${character.characterId || 'unknown'}-${index}`}
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
            )}
        </div>
    );
};

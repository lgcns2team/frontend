import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HistoryMap.css';
import '../../../shared/config/era-theme.css';
import { getEraForYear } from '../../../shared/config/era-theme';
import { loadHistoricalBorders } from '../lib/boundary-utils';
import { loadTradeRoutes } from '../lib/trade-route';
import type { TradeRouteWithColor } from '../lib/trade-route';
import { useTradeAnimation } from '../lib/useTradeAnimation';
import { useWarLayer } from '../lib/useWarLayer';
import { useFrontlineAnimation } from '../lib/useFrontlineAnimation';
import { isKoreanWarPeriod, KOREAN_WAR_START } from '../../../shared/api/korean-war-api';
import { fetchPersonsByYear, fetchAllPersons, type PersonData } from '../../../shared/api/person-api';

// Features
import { TimeControls } from '../../../features/time-controls';
import { PlayControls } from '../../../features/play-controls';
import { MapLayers } from '../../../features/map-layers';
import { SidebarMenu } from '../../../features/sidebar-menu';
import { Timeline } from '../../../features/timeline';
import { DockingPanel } from '../../../features/docking-panel/ui/DockingPanel';
import { FloatingPanel } from '../../../features/floating-panel/ui/FloatingPanel';
import { ChatbotTrigger, ChatbotPanel } from '../../../features/chatbot';
import { TextbookPanel } from '../../../features/textbook-panel';
import { MajorEventsPanel, EventModal } from '../../../features/major-events';
import { CharactersPanel } from '../../../features/ai-character';
import { ChatPanel } from '../../../features/ai-chat';
import type { ParsedCharacter } from '../../../shared/api/characters-api';
import { fetchCountryByCode, type CountryData } from '../../../shared/api/country-api';
import type { ParsedMainEvent } from '../../../shared/api/main-events-api';
import { ProfileButton } from '../../../features/profile-button';
import { NukeExplosion } from '../../../features/nuke-explosion';
import { FallingBomb } from '../../../features/falling-bomb';
import { DiscussionPanel } from '../../../features/discussion';
import { CloudTransition } from '../../../features/cloud-transition/ui/CloudTransition';
import { MyPagePanel } from '../../../features/mypage';
import { DayTimelineSlider } from '../../../features/day-timeline';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface CapitalData {
    capitalId: number;
    capitalName: string;
    latitude: number;
    longitude: number;
    startedDate: string; // Changed from number to string
    endedDate: string;   // Changed from number to string
    description: string;
    summary: string;
    countryId: string;
    countryName: string;
}

export default function HistoryMap() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<L.Map | null>(null);
    const historicalLayer = useRef<L.Layer | null>(null);
    const markersLayer = useRef<L.LayerGroup | null>(null);
    const tradeLayer = useRef<L.LayerGroup | null>(null);
    const lastRequestedYear = useRef<number>(326);
    const layerCache = useRef<Map<number, L.Layer>>(new Map());
    const abortController = useRef<AbortController | null>(null);
    const [capitalData, setCapitalData] = useState<CapitalData[]>([]);
    const [activeTradeRoutes, setActiveTradeRoutes] = useState<TradeRouteWithColor[]>([]);
    const [personData, setPersonData] = useState<PersonData[]>([]);

    const [currentYear, setCurrentYear] = useState<number>(() => {
        const savedYear = localStorage.getItem('historyMapYear');
        return savedYear ? parseInt(savedYear, 10) : 1244;
    });
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(1);
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [layerType, setLayerType] = useState<'default' | 'battles' | 'trade' | 'people'>(() => {
        const savedLayer = localStorage.getItem('historyMapLayer');
        return (savedLayer as 'default' | 'battles' | 'trade' | 'people') || 'default';
    });
    const [selectedCountry, setSelectedCountry] = useState<{ name: string; properties: any } | null>(null);
    const [selectedCountryData, setSelectedCountryData] = useState<CountryData | null>(null);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [chatbotState, setChatbotState] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);

    // Textbook State
    const [textbookPage, setTextbookPage] = useState(0);
    const [textbookViewMode, setTextbookViewMode] = useState<'single' | 'double'>('single');
    const [dockingPanelWidth, setDockingPanelWidth] = useState(800);
    const [isConversationMode, setIsConversationMode] = useState(false);
    const [chatCharacter, setChatCharacter] = useState<ParsedCharacter | null>(null);

    // Event Popup State
    const [selectedEvent, setSelectedEvent] = useState<ParsedMainEvent | null>(null);

    // Character Panel Toggle State
    const [characterPanelToggle, setCharacterPanelToggle] = useState<React.ReactNode>(null);

    // Cloud Transition State
    const [isCloudTransitionActive, setIsCloudTransitionActive] = useState(false);

    // My Page State
    const [showMyPage, setShowMyPage] = useState(false);

    // Korean War Mode State (Day-based timeline)
    const [isKoreanWarMode, setIsKoreanWarMode] = useState(false);
    const [currentKoreanWarDate, setCurrentKoreanWarDate] = useState(KOREAN_WAR_START);
    const [isKoreanWarPlaying, setIsKoreanWarPlaying] = useState(false);
    const [koreanWarSpeed, setKoreanWarSpeed] = useState(1);
    const [koreanWarFrontlines, setKoreanWarFrontlines] = useState<any[]>([]);

    const handleTransitionComplete = () => {
        setIsCloudTransitionActive(false);
    };

    const handleEventClickWithTransition = (event: ParsedMainEvent) => {
        setIsCloudTransitionActive(true);

        // Schedule the actual navigation to happen when the screen is covered by clouds
        // Animation is 2.5s total.
        // 0% -> 30% (0.75s): Fade in + Scale down (Covering starts)
        // 30% -> 70% (1.75s): Stay covered
        // 70% -> 100% (2.5s): Fade out
        // Trigger change at around 1.2s to be safe
        setTimeout(() => {
            handleYearChange(event.year);
            setSelectedEvent(event);
            setActivePanel(null); // Close docking panel if open (like finding from search)
        }, 1200);
    };

    // Nuke Explosion State
    const [explosions, setExplosions] = useState<{ id: number; x: number; y: number; scale: number }[]>([]);
    const [showHiroshimaBomb, setShowHiroshimaBomb] = useState(false);
    const [showNagasakiBomb, setShowNagasakiBomb] = useState(false);
    const [hiroshimaScreenPos, setHiroshimaScreenPos] = useState({ x: 0, y: 0 });
    const [nagasakiScreenPos, setNagasakiScreenPos] = useState({ x: 0, y: 0 });
    const [currentMapZoom, setCurrentMapZoom] = useState(6);
    // Timeline visibility: 'full' | 'no-events' | 'hidden' | 'full-hidden'
    const [timelineVisibility, setTimelineVisibility] = useState<'full' | 'no-events' | 'hidden' | 'full-hidden'>('no-events');

    const handleTimelineIncrease = () => {
        setTimelineVisibility(prev => {
            if (prev === 'full') return 'no-events';
            if (prev === 'no-events') return 'hidden';
            if (prev === 'hidden') return 'full-hidden';
            return 'full-hidden';
        });
    };

    const handleTimelineDecrease = () => {
        setTimelineVisibility(prev => {
            if (prev === 'full-hidden') return 'hidden';
            if (prev === 'hidden') return 'no-events';
            if (prev === 'no-events') return 'full';
            return 'full';
        });
    };

    // Backward compatibility for UI visibility
    const isUIVisible = timelineVisibility !== 'hidden' && timelineVisibility !== 'full-hidden';
    const isAllUIHidden = timelineVisibility === 'full-hidden';
    // War Layer Hook
    // War Layer Hook
    useWarLayer(map.current, currentYear, layerType === 'battles' && !isKoreanWarMode, historicalLayer.current, currentMapZoom);

    // Korean War Frontline Animation Hook
    const { warData: koreanWarData } = useFrontlineAnimation({
        map: map.current,
        isActive: isKoreanWarMode && layerType === 'battles',
        currentDate: currentKoreanWarDate,
        animationSpeed: koreanWarSpeed
    });

    // Update frontlines when Korean War data loads
    useEffect(() => {
        if (koreanWarData?.frontlines) {
            setKoreanWarFrontlines(koreanWarData.frontlines);
        }
    }, [koreanWarData]);

    // Activate Korean War mode when year is 1950-1953 and battles layer is active
    useEffect(() => {
        const shouldBeKoreanWarMode = isKoreanWarPeriod(currentYear) && layerType === 'battles';
        if (shouldBeKoreanWarMode && !isKoreanWarMode) {
            setIsKoreanWarMode(true);
            // Set date based on year
            if (currentYear === 1950) setCurrentKoreanWarDate('1950-06-25');
            else if (currentYear === 1951) setCurrentKoreanWarDate('1951-01-01');
            else if (currentYear === 1952) setCurrentKoreanWarDate('1952-01-01');
            else if (currentYear === 1953) setCurrentKoreanWarDate('1953-01-01');
        } else if (!shouldBeKoreanWarMode && isKoreanWarMode) {
            setIsKoreanWarMode(false);
            setIsKoreanWarPlaying(false);
        }
    }, [currentYear, layerType, isKoreanWarMode]);

    const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);



    // Initialize Map
    useEffect(() => {
        if (!mapContainer.current) return;

        // Check for auto-open panel request
        const openPanelRequest = localStorage.getItem('openPanel');
        if (openPanelRequest) {
            setActivePanel(openPanelRequest);
            if (openPanelRequest === 'discussion') {
                setDockingPanelWidth(window.innerWidth * 0.25);
            }
            localStorage.removeItem('openPanel');
        }

        // Load saved map state from localStorage
        const savedZoom = localStorage.getItem('historyMapZoom');
        const savedCenter = localStorage.getItem('historyMapCenter');

        let initialZoom = 6;
        let initialCenter: [number, number] = [37, 123.5];

        if (savedZoom) {
            initialZoom = parseInt(savedZoom, 10);
        }

        if (savedCenter) {
            try {
                initialCenter = JSON.parse(savedCenter);
            } catch (e) {
                console.error('Failed to parse saved center:', e);
            }
        }

        // Initialize map with saved or default values
        map.current = L.map(mapContainer.current, {
            center: initialCenter,
            zoom: initialZoom,
            zoomControl: false,
            attributionControl: false
        });

        // Save map state when zoom or move ends
        map.current.on('zoomend', () => {
            if (map.current) {
                localStorage.setItem('historyMapZoom', map.current.getZoom().toString());
            }
        });

        map.current.on('moveend', () => {
            if (map.current) {
                const center = map.current.getCenter();
                localStorage.setItem('historyMapCenter', JSON.stringify([center.lat, center.lng]));
            }
        });

        // Add tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(map.current);

        // Initial load
        // Initial load
        updateMapForYear(currentYear);

        markersLayer.current = L.layerGroup().addTo(map.current);
        tradeLayer.current = L.layerGroup().addTo(map.current);

        // Load capital data from API
        // Load capital data from API
        const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
        const token = localStorage.getItem('accessToken');
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        fetch(`${API_BASE_URL}/capitals`, { headers })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch capitals: ' + res.statusText);
                return res.json();
            })
            .then(data => {
                console.log('Capital data loaded:', data);
                if (data.length > 0) {
                    console.log('First capital sample:', data[0]);
                }
                setCapitalData(data);
            })
            .catch(err => console.error('Failed to load capital data:', err));

        return () => {
            map.current?.remove();
        };
    }, []);

    // Update map when year changes with debounce, or when Korean War mode changes
    useEffect(() => {
        const timer = setTimeout(() => {
            updateMapForYear(currentYear);
        }, 100); // 100ms debounce

        return () => clearTimeout(timer);
    }, [currentYear, isKoreanWarMode, layerType]);

    // Save year to localStorage
    // Save year to localStorage
    useEffect(() => {
        if (currentYear !== null && currentYear !== undefined) {
            localStorage.setItem('historyMapYear', currentYear.toString());
        }
    }, [currentYear]);

    // Handle window resize to update panel width based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (activePanel && activePanel !== 'textbook') {
                if (activePanel === 'search' || activePanel === 'discussion') {
                    setDockingPanelWidth(window.innerWidth * 0.25);
                } else if (activePanel === 'people') {
                    setDockingPanelWidth(window.innerWidth * 0.5);
                } else {
                    setDockingPanelWidth(window.innerWidth * 0.4);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activePanel]);

    // Auto-close FloatingPanel if currentYear is outside the selected country's range
    useEffect(() => {
        if (selectedCountryData) {
            const { foundationYear, endedYear } = selectedCountryData;
            // Check if currentYear is strictly outside the range
            if (currentYear < foundationYear || currentYear > endedYear) {
                setSelectedCountry(null);
                setSelectedCountryData(null);
            }
        }
    }, [currentYear, selectedCountryData]);

    // Save layerType to localStorage
    useEffect(() => {
        localStorage.setItem('historyMapLayer', layerType);
    }, [layerType]);

    // Fetch person data when layer is 'people' and year changes
    useEffect(() => {
        if (layerType === 'people') {
            fetchPersonsByYear(currentYear).then(data => {
                setPersonData(data);
            });
        } else {
            setPersonData([]);
        }
    }, [layerType, currentYear]);

    // Update Markers when layer type changes or capital data loads
    useEffect(() => {
        updateMarkers(currentYear);
    }, [layerType, capitalData, personData, currentMapZoom]);

    // Update Trade Routes
    useEffect(() => {
        let isMounted = true;

        const updateTradeRoutes = async () => {
            if (!map.current || !tradeLayer.current) return;

            // Clear existing layers first
            tradeLayer.current.clearLayers();

            // Only load trade routes if the trade layer is active
            if (layerType !== 'trade') {
                setActiveTradeRoutes([]);
                return;
            }

            const routesWithColor = await loadTradeRoutes(currentYear);

            if (!isMounted) return;

            if (routesWithColor.length > 0) {
                routesWithColor.forEach(({ route, trade }) => {
                    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
                    const latLngs = route.path.coordinates.map(coord => [coord[1], coord[0]] as L.LatLngTuple);

                    // Create dashed polyline for trade routes
                    const routeLayer = L.polyline(latLngs, {
                        color: route.routeColor || '#3b82f6',
                        weight: 3,
                        dashArray: '10, 10', // Dashed line effect
                        opacity: 0.8,
                        interactive: true
                    });

                    routeLayer.bindPopup(`
                        <div>
                            <strong>${trade.startCountry.countryName} → ${trade.endCountry.countryName}</strong><br/>
                            품목: ${trade.product}<br/>
                            연도: ${trade.tradeYear}년
                        </div>
                    `).addTo(tradeLayer.current!);
                });
            }

            setActiveTradeRoutes(routesWithColor);
        };

        updateTradeRoutes();

        return () => {
            isMounted = false;
        };
    }, [currentYear, layerType]);

    // Trade Animation Hook
    useTradeAnimation({
        map: map.current,
        routes: activeTradeRoutes,
        historicalLayer: historicalLayer.current,
        isActive: layerType === 'trade',
        speed: speed,
        currentYear: currentYear
    });

    // Nuke Explosion Effect for Hiroshima and Nagasaki in 1945
    useEffect(() => {
        if (currentYear === 1945 && layerType === 'battles' && map.current) {
            // 1. 히로시마 폭탄 먼저 낙하
            setShowHiroshimaBomb(true);

            // 2. 3초 후 나가사키 폭탄 낙하
            const nagasakiTimer = setTimeout(() => {
                setShowNagasakiBomb(true);
            }, 3000);

            return () => clearTimeout(nagasakiTimer);
        } else {
            // 다른 년도나 다른 탭에서는 폭발 이펙트 제거
            setShowHiroshimaBomb(false);
            setShowNagasakiBomb(false);
            setExplosions([]);
        }
    }, [currentYear, layerType]);

    // 히로시마/나가사키 화면 좌표 실시간 업데이트 (지도 이동/줌 시)
    useEffect(() => {
        if (!map.current) return;

        const updateBombPositions = () => {
            if (!map.current) return;

            // 히로시마 원폭 투하 지점: 34.3946° N, 132.4537° E (원폭 돔)
            const hiroshimaLatLng = L.latLng(34.3946, 132.4537);
            const hiroshimaPoint = map.current.latLngToContainerPoint(hiroshimaLatLng);
            setHiroshimaScreenPos({ x: hiroshimaPoint.x, y: hiroshimaPoint.y });

            // 나가사키 원폭 투하 지점: 32.7731° N, 129.8656° E (우라카미)
            const nagasakiLatLng = L.latLng(32.7731, 129.8656);
            const nagasakiPoint = map.current.latLngToContainerPoint(nagasakiLatLng);
            setNagasakiScreenPos({ x: nagasakiPoint.x, y: nagasakiPoint.y });

            setCurrentMapZoom(map.current.getZoom());
        };

        // 초기 위치 설정
        updateBombPositions();

        // 지도 이동/줌 시 업데이트
        map.current.on('move', updateBombPositions);
        map.current.on('zoom', updateBombPositions);

        return () => {
            if (map.current) {
                map.current.off('move', updateBombPositions);
                map.current.off('zoom', updateBombPositions);
            }
        };
    }, []);

    // 히로시마 폭탄 충돌 시 폭발 이펙트 트리거
    const handleHiroshimaBombImpact = () => {
        if (map.current) {
            // 폭탄 숨기기
            setShowHiroshimaBomb(false);

            // 현재 줌 레벨 가져오기
            const currentZoom = map.current.getZoom();
            // 기본 줌 6을 기준으로 역보정 계수 계산 (줌 아웃하면 작게)
            const scale = Math.pow(2, currentZoom - 6);

            // 히로시마 좌표로 폭발 이펙트 추가
            const hiroshimaLatLng = L.latLng(34.3946, 132.4537);
            const point = map.current.latLngToContainerPoint(hiroshimaLatLng);

            const newExplosion = {
                id: Date.now(),
                x: point.x,
                y: point.y,
                scale: scale
            };

            setExplosions(prev => [...prev, newExplosion]);

            // 2.3초 후 폭발 이펙트 제거
            setTimeout(() => {
                setExplosions(prev => prev.filter(ex => ex.id !== newExplosion.id));
            }, 2300);
        }
    };

    // 나가사키 폭탄 충돌 시 폭발 이펙트 트리거
    const handleNagasakiBombImpact = () => {
        if (map.current) {
            // 폭탄 숨기기
            setShowNagasakiBomb(false);

            // 현재 줌 레벨 가져오기
            const currentZoom = map.current.getZoom();
            // 기본 줌 6을 기준으로 역보정 계수 계산 (줌 아웃하면 작게)
            const scale = Math.pow(2, currentZoom - 6);

            // 나가사키 좌표로 폭발 이펙트 추가
            const nagasakiLatLng = L.latLng(32.7731, 129.8656);
            const point = map.current.latLngToContainerPoint(nagasakiLatLng);

            const newExplosion = {
                id: Date.now() + 1,
                x: point.x,
                y: point.y,
                scale: scale
            };

            setExplosions(prev => [...prev, newExplosion]);

            // 2.3초 후 폭발 이펙트 제거
            setTimeout(() => {
                setExplosions(prev => prev.filter(ex => ex.id !== newExplosion.id));
            }, 2300);
        }
    };

    // 폭발 이펙트를 나가사키 좌표에 고정시키는 useEffect
    // 폭발 이펙트 위치 업데이트 (지도 이동/줌 시)
    useEffect(() => {
        if (!map.current || explosions.length === 0) return;

        const updateExplosionPositions = () => {
            if (!map.current) return;

            setExplosions(prev => prev.map(ex => {
                // 각 폭발의 원래 지리 좌표를 저장하고 화면 좌표로 변환
                let latLng: L.LatLng;

                // 폭발 ID를 기반으로 원래 위치 판단 (간단한 방법으로 ID가 홀수면 히로시마, 짝수면 나가사키)
                // 더 정확하게는 폭발 생성 시 지리 좌표를 저장해야 하지만, 이미 생성된 폭발의 위치를 추적
                // 히로시마 좌표 범위에 있으면 히로시마, 아니면 나가사키
                const hiroshimaLatLng = L.latLng(34.3946, 132.4537);
                const nagasakiLatLng = L.latLng(32.7731, 129.8656);

                // 현재 폭발 위치가 히로시마에 가까운지 확인
                const hiroshimaPoint = map.current!.latLngToContainerPoint(hiroshimaLatLng);
                const nagasakiPoint = map.current!.latLngToContainerPoint(nagasakiLatLng);

                // 현재 폭발이 어느 위치에 더 가까운지 판단
                const distToHiroshima = Math.sqrt(Math.pow(ex.x - hiroshimaPoint.x, 2) + Math.pow(ex.y - hiroshimaPoint.y, 2));
                const distToNagasaki = Math.sqrt(Math.pow(ex.x - nagasakiPoint.x, 2) + Math.pow(ex.y - nagasakiPoint.y, 2));

                latLng = distToHiroshima < distToNagasaki ? hiroshimaLatLng : nagasakiLatLng;

                const point = map.current!.latLngToContainerPoint(latLng);

                return {
                    ...ex,
                    x: point.x,
                    y: point.y
                };
            }));
        };

        // 초기 위치 설정
        updateExplosionPositions();

        // 지도 이동/줌 시 위치 업데이트
        map.current.on('move', updateExplosionPositions);
        map.current.on('zoom', updateExplosionPositions);

        return () => {
            if (map.current) {
                map.current.off('move', updateExplosionPositions);
                map.current.off('zoom', updateExplosionPositions);
            }
        };
    }, [explosions.length]);

    // 폭발이 끝나면 배열에서 제거하는 함수
    const removeExplosion = (id: number) => {
        setExplosions(prev => prev.filter(ex => ex.id !== id));
    };

    const updateMapForYear = async (year: number) => {
        if (!map.current) return;

        // Cancel previous pending request
        if (abortController.current) {
            abortController.current.abort();
        }

        // Create new controller for this request
        const controller = new AbortController();
        abortController.current = controller;

        lastRequestedYear.current = year;
        const requestId = year;

        // Check if Korean War mode should be active
        const shouldUseKoreanWarMode = isKoreanWarMode && layerType === 'battles';

        try {
            let newLayer: L.Layer | null = null;

            // Create cache key that includes Korean War mode state
            const cacheKey = shouldUseKoreanWarMode ? `${year}_kw` : `${year}`;

            // Check cache first (with Korean War mode awareness)
            if (layerCache.current.has(cacheKey as any)) {
                newLayer = layerCache.current.get(cacheKey as any)!;
            } else {
                newLayer = await loadHistoricalBorders(year, {
                    onCountryClick: async (name, props) => {
                        setSelectedCountry({ name, properties: props });
                        setSelectedCountryData(null); // Reset previous data

                        if (props.CODE) {
                            const data = await fetchCountryByCode(props.CODE);
                            if (data) {
                                setSelectedCountryData(data);
                            }
                        }
                    },
                    isKoreanWarMode: shouldUseKoreanWarMode
                });

                // If aborted during await, stop here
                if (controller.signal.aborted) return;

                if (newLayer) {
                    layerCache.current.set(cacheKey as any, newLayer);
                }
            }

            // Double check if this is still the latest request
            if (requestId !== lastRequestedYear.current) {
                return;
            }

            if (newLayer) {
                // Remove existing layer
                if (historicalLayer.current && historicalLayer.current !== newLayer) {
                    map.current.removeLayer(historicalLayer.current);
                }

                // Add new layer only if it's not already on the map
                if (!map.current.hasLayer(newLayer)) {
                    newLayer.addTo(map.current);
                }
                historicalLayer.current = newLayer;
            }

            // Update markers based on year
            updateMarkers(year);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                // Ignore abort errors
                return;
            }
            console.error('Failed to load historical data:', error);
        }
    };

    const updateMarkers = (year: number) => {
        if (!markersLayer.current || !map.current) return;

        markersLayer.current.clearLayers();

        // In battles mode, don't show any markers (handled by useWarLayer)
        if (layerType === 'battles') {
            return;
        }

        // In people mode, show person markers instead of capital markers
        if (layerType === 'people') {
            // Group persons by proximity to detect overlapping markers
            const PROXIMITY_THRESHOLD = 0.5; // degrees (roughly 50km)
            const ICON_OFFSET_AMOUNT = 40; // pixels offset for visual separation

            // Create a map to track positions and count overlaps
            const positionMap = new Map<string, { persons: typeof personData, index: number }>();

            personData.forEach(person => {
                if (!person.latitude || !person.longitude) return;

                // Round coordinates to detect nearby markers
                const key = `${Math.round(person.latitude / PROXIMITY_THRESHOLD)}_${Math.round(person.longitude / PROXIMITY_THRESHOLD)}`;

                if (!positionMap.has(key)) {
                    positionMap.set(key, { persons: [], index: 0 });
                }
                positionMap.get(key)!.persons.push(person);
            });

            // Now render with visual offsets for overlapping markers
            positionMap.forEach(group => {
                const count = group.persons.length;

                group.persons.forEach((person, idx) => {
                    if (!person.latitude || !person.longitude) return;

                    // Calculate icon anchor offset for visual separation (keeps original coordinates)
                    let anchorOffsetX = 75; // default anchor X
                    let anchorOffsetY = 50; // default anchor Y

                    if (count > 1) {
                        // Offset icon anchor in a circle pattern for visual separation
                        const angle = (2 * Math.PI * idx) / count;
                        anchorOffsetX = 75 + Math.cos(angle) * ICON_OFFSET_AMOUNT;
                        anchorOffsetY = 50 + Math.sin(angle) * ICON_OFFSET_AMOUNT;
                    }

                    // Use character image based on person name
                    const characterImagePath = `/assets/images/character/${encodeURIComponent(person.name)}.png`;

                    const icon = L.divIcon({
                        className: 'person-marker',
                        html: `
                        <div style="display: flex; flex-direction: column; align-items: center; width: 150px;">
                            <img src="${characterImagePath}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" onerror="this.src='/assets/images/country-summary/sudo.png'" />
                            <div style="font-size: 14px; font-weight: bold; color: white; margin-top: 2px; text-align: center; width: 100%; white-space: nowrap; text-shadow: 1px 1px 2px black;">${person.name}</div>
                        </div>
                    `,
                        iconSize: [60, 75],
                        iconAnchor: [anchorOffsetX, anchorOffsetY] // Visual offset only
                    });

                    const birthYear = person.year < 0 ? `기원전 ${Math.abs(person.year)}년` : `${person.year}년`;
                    const deathYear = person.deathYear
                        ? (person.deathYear < 0 ? `기원전 ${Math.abs(person.deathYear)}년` : `${person.deathYear}년`)
                        : '미상';

                    const popupContent = `
                    <div style="text-align: center; max-width: 250px;">
                        <h3 style="margin: 0 0 5px 0;">${person.name}</h3>
                        <p style="margin: 0; font-size: 12px; color: #666;">${person.era}</p>
                        <p style="margin: 5px 0; font-size: 11px; color: #888;">${birthYear} ~ ${deathYear}</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px;">${person.summary || ''}</p>
                    </div>
                `;

                    // Only show marker if zoom level > 5 (same as battle markers)
                    const markerOpacity = currentMapZoom > 4 ? 1 : 0;

                    // Use ORIGINAL coordinates - visual offset is only via iconAnchor
                    L.marker([person.latitude, person.longitude], { icon, opacity: markerOpacity })
                        .addTo(markersLayer.current!)
                        .bindPopup(popupContent);
                });
            });
            return;
        }

        // Default mode and trade mode: show capital markers
        if (capitalData.length > 0) {
            const activeCapitals = capitalData.filter(capital => {
                const startYear = parseInt(capital.startedDate.substring(0, 4));
                const endYear = parseInt(capital.endedDate.substring(0, 4));
                return year >= startYear && year <= endYear;
            });

            activeCapitals.forEach(capital => {
                if (capital.latitude && capital.longitude) {
                    const icon = L.divIcon({
                        className: 'capital-marker',
                        html: `
                        <div style="display: flex; flex-direction: column; align-items: center; width: 150px;">
                            <img src="/assets/images/country-summary/sudo.png" style="width: 45px; height: 45px; object-fit: contain;" />
                            <div style="font-size: 14px; font-weight: bold; color: white; margin-top: 2px; text-align: center; width: 100%; white-space: nowrap;">${capital.capitalName}</div>
                        </div>
                    `,
                        iconSize: [60, 45],
                        iconAnchor: [75, 40]
                    });

                    const popupContent = `
                    <div style="text-align: center;">
                        <h3 style="margin: 0 0 5px 0;">${capital.countryName}</h3>
                        <p style="margin: 0;">수도: ${capital.capitalName}</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">${capital.summary || ''}</p>
                    </div>
                `;

                    L.marker([capital.latitude, capital.longitude], { icon })
                        .addTo(markersLayer.current!)
                        .bindPopup(popupContent);
                }
            });
        }
    };

    // Auto Play
    useEffect(() => {
        if (isPlaying) {
            const intervalMs = 1000 / speed;
            playInterval.current = setInterval(() => {
                setCurrentYear(prev => {
                    const next = prev + 1;
                    if (next > 2024) {
                        setIsPlaying(false);
                        return 2024;
                    }
                    return next;
                });
            }, intervalMs);
        } else {
            if (playInterval.current) {
                clearInterval(playInterval.current);
                playInterval.current = null;
            }
        }
        return () => {
            if (playInterval.current) clearInterval(playInterval.current);
        };
    }, [isPlaying, speed]);

    const toggleSpeed = () => {
        setSpeed(prev => prev >= 4 ? 1 : prev * 2);
    };

    // Calculate optimal width for textbook (full height since no header)
    const calculateTextbookWidth = (mode: 'single' | 'double') => {
        const availableHeight = window.innerHeight; // Full height, no header offset
        const pageRatio = 1 / 1.37; // Width / Height

        let targetWidth;
        if (mode === 'single') {
            targetWidth = availableHeight * pageRatio;
        } else {
            targetWidth = availableHeight * pageRatio * 2;
        }

        // Add some padding buffer
        return Math.min(Math.max(targetWidth + 40, 300), 1600);
    };

    // Update width on resize
    useEffect(() => {
        if (activePanel === 'textbook') {
            const handleResize = () => {
                setDockingPanelWidth(calculateTextbookWidth(textbookViewMode));
            };

            window.addEventListener('resize', handleResize);
            // Initial calculation
            handleResize();

            return () => window.removeEventListener('resize', handleResize);
        }
    }, [activePanel, textbookViewMode]);

    // Panel Handlers
    const handleSidebarClick = (id: string) => {
        setActivePanel(prev => prev === id ? null : id);

        if (id === 'textbook') {
            // Reset width when opening textbook
            setDockingPanelWidth(calculateTextbookWidth(textbookViewMode));
        } else if (id === 'search' || id === 'discussion') {
            // Major Events & Discussion Panel width - 25% of screen width
            setDockingPanelWidth(window.innerWidth * 0.25);
        } else if (id === 'people') {
            // Characters Panel width - 50% of screen width
            setDockingPanelWidth(window.innerWidth * 0.5);
        } else {
            // Default width for other panels - 40% of screen width
            setDockingPanelWidth(window.innerWidth * 0.4);
        }
    };



    const getPanelTitle = (id: string | null) => {
        switch (id) {
            case 'search': return '주요사건';
            case 'textbook': return '교과서';
            case 'people': return '인물';
            case 'discussion': return '토론';
            case 'settings': return '설정';
            default: return '';
        }
    };

    const handleYearChange = (year: number) => {
        setCurrentYear(year);
    };


    const handleVoiceChat = () => {
        setTextbookViewMode('single');
        setIsConversationMode(true);
    };

    const handleCharacterSelect = (character: ParsedCharacter) => {
        setChatCharacter(character);
    };

    // Handle navigation to character chat from AI chatbot tool call
    const handleNavigateToCharacter = async (promptId: string, characterName: string) => {
        console.log('🚀 [HistoryMap] Navigating to character chat:', characterName, promptId);

        // Create a minimal character object for the chat panel
        // imagePath는 캐릭터 이름 기반으로 설정 (예: /assets/images/character/이순신.png)
        const character: ParsedCharacter = {
            characterId: promptId,
            characterName: characterName,
            birthYear: null,
            era: null,
            summary: '',
            promptId: promptId,
            imagePath: `/assets/images/character/${characterName}.png`,
        };

        // Open the people panel and set the character
        setActivePanel('people');
        setDockingPanelWidth(window.innerWidth * 0.5);
        setChatCharacter(character);
    };

    // Handle navigation to war from AI chatbot tool call
    const handleNavigateToWar = (year: number, warName: string) => {
        console.log('⚔️ [HistoryMap] Navigating to war:', warName, year);

        // 해당 년도로 이동
        setCurrentYear(year);

        // 전쟁 레이어 활성화
        setLayerType('battles');

        console.log('✅ [HistoryMap] Year set to', year, '/ Layer set to battles');
    };

    // Handle person click from textbook panel
    const handlePersonClickFromTextbook = async (personName: string) => {
        console.log('📖 [HistoryMap] Person clicked from textbook:', personName);

        try {
            // 인물 데이터에서 해당 인물의 promptId 찾기
            const allPersons = await fetchAllPersons();
            const person = allPersons.find(p => p.name === personName);

            // 교과서 대화 모드 활성화 (handleVoiceChat과 동일한 동작)
            setTextbookViewMode('single');
            setIsConversationMode(true);

            // 인물 캐릭터 설정
            if (person) {
                const character: ParsedCharacter = {
                    characterId: person.promptId,
                    characterName: person.name,
                    birthYear: null,
                    era: null,
                    summary: '',
                    promptId: person.promptId,
                    imagePath: `/assets/images/character/${person.name}.png`,
                };
                setChatCharacter(character);
                console.log('✅ [HistoryMap] Character set for textbook conversation:', person.name);
            } else {
                console.warn('⚠️ [HistoryMap] Person not found:', personName);
                // 인물 정보가 없어도 기본 값으로 설정
                const character: ParsedCharacter = {
                    characterId: personName,
                    characterName: personName,
                    birthYear: null,
                    era: null,
                    summary: '',
                    promptId: personName,
                    imagePath: `/assets/images/character/${personName}.png`,
                };
                setChatCharacter(character);
            }
        } catch (error) {
            console.error('❌ [HistoryMap] Failed to fetch person data:', error);
        }
    };

    // Dynamic Theme Calculation
    const currentEra = getEraForYear(currentYear);




    return (
        <div className={`history-map-container theme-${currentEra.id}`}>
            <div id="map" ref={mapContainer}></div>

            {/* Top Center: Search Year only */}
            {/* <div className={`center-controls-group ${!isUIVisible ? 'ui-hidden' : ''}`}>
                <SearchYear
                    currentYear={currentYear}
                    onYearChange={setCurrentYear}
                />
            </div> */}

            {/* Top Left: Year, Play, Speed, Layers */}
            <div className="top-left-overlay">
                {/* Floating Info Panel (Left) */}
                <FloatingPanel
                    isOpen={!!selectedCountry}
                    onClose={() => setSelectedCountry(null)}
                    title={selectedCountry?.name || '국가 정보'}
                    subtitle={selectedCountryData ? `${selectedCountryData.foundationYear} ~ ${selectedCountryData.endedYear}` : currentYear > 0 ? currentYear + '년' : 'BC ' + Math.abs(currentYear) + '년'}
                    currentYear={currentYear}
                >
                    <div className="country-details">
                        {selectedCountryData ? (
                            <div className="country-info-content">
                                <p style={{ whiteSpace: 'pre-line', lineHeight: '1.5', margin: '0 0 5px 0' }}>
                                    {selectedCountryData.description}
                                </p>
                                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.9em' }}>
                                    <strong>요약:</strong> {selectedCountryData.summary}
                                </div>
                            </div>
                        ) : (
                            selectedCountry?.properties && (
                                <>
                                    <p>{selectedCountry.name}에 대한 상세 정보가 없습니다.</p>
                                </>
                            )
                        )}
                    </div>
                </FloatingPanel>

                {!isAllUIHidden && (
                    <>
                        <MapLayers
                            activeLayer={layerType}
                            onLayerChange={setLayerType}
                            currentYear={currentYear}
                        />
                    </>
                )}


            </div>

            {/* Top Right: Menu */}
            <div className="top-right-overlay">

                <div className={`header-controls-group ${!isUIVisible ? 'ui-hidden' : ''}`}>
                    <div onClick={() => setShowMyPage(!showMyPage)}>
                        <ProfileButton />
                    </div>
                </div>

                {!isAllUIHidden && (
                    <SidebarMenu
                        onItemClick={handleSidebarClick}
                        isDockingPanelOpen={!!activePanel}
                    />
                )}
            </div>

            {/* My Page Panel */}
            {showMyPage && (
                <MyPagePanel onClose={() => setShowMyPage(false)} />
            )}

            {/* Right Docking Panel */}
            <DockingPanel
                isOpen={!!activePanel}
                onClose={() => {
                    if (activePanel === 'textbook' && isConversationMode) {
                        setActivePanel('people');
                        setIsConversationMode(false);
                    } else if (activePanel === 'people' && chatCharacter) {
                        setChatCharacter(null);
                    } else {
                        setActivePanel(null);
                        setIsConversationMode(false);
                        setChatCharacter(null);
                    }
                }}
                title={activePanel === 'people' && chatCharacter ? "대화" : getPanelTitle(activePanel)}
                style={activePanel === 'textbook' && isConversationMode ? { right: '50%', borderRight: '1px solid #ccc' } : undefined}
                width={dockingPanelWidth}
                minWidth={activePanel === 'textbook' ? 300 : 180}
                maxWidth={1600}
                hideHeader={activePanel === 'textbook'}
                headerRightContent={
                    activePanel === 'people'
                        ? (chatCharacter ? null : characterPanelToggle)
                        : null
                }
            >
                {activePanel === 'textbook' ? (
                    <TextbookPanel
                        currentPage={textbookPage}
                        viewMode={textbookViewMode}
                        onPageChange={setTextbookPage}
                        onViewModeChange={setTextbookViewMode}
                        onVoiceChat={handleVoiceChat}
                        isConversationMode={isConversationMode}
                        onPersonClick={handlePersonClickFromTextbook}
                    />
                ) : activePanel === 'search' ? (
                    <MajorEventsPanel
                        onYearChange={handleYearChange}
                        onEventClick={handleEventClickWithTransition}
                    />
                ) : activePanel === 'people' ? (
                    chatCharacter ? (
                        <ChatPanel
                            character={chatCharacter}
                        />
                    ) : (
                        <CharactersPanel
                            onYearChange={handleYearChange}
                            onCharacterClick={handleCharacterSelect}
                            currentYear={currentYear}
                            renderToggle={setCharacterPanelToggle}
                        />
                    )
                ) : activePanel === 'discussion' ? (
                    <DiscussionPanel />
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ui-text)' }}>
                        <p>{getPanelTitle(activePanel)} 패널 내용이 여기에 표시됩니다.</p>
                        <p>현재 연도: {currentYear}년</p>
                    </div>
                )}
            </DockingPanel>

            {(activePanel === 'textbook' && isConversationMode) && (
                <DockingPanel
                    isOpen={true}
                    onClose={() => {
                        setIsConversationMode(false);
                        setChatCharacter(null); // Reset chat
                    }}
                    title={chatCharacter ? "대화" : "인물 대화"}
                    width={window.innerWidth * 0.5}
                    style={{ right: 0 }}
                    headerRightContent={chatCharacter ? undefined : characterPanelToggle}
                >
                    {chatCharacter ? (
                        <ChatPanel
                            character={chatCharacter}
                        />
                    ) : (
                        <CharactersPanel
                            onYearChange={handleYearChange}
                            onCharacterClick={handleCharacterSelect}
                            currentYear={currentYear}
                            renderToggle={setCharacterPanelToggle}
                        />
                    )}
                </DockingPanel>
            )}

            {/* Bottom Left: Chatbot */}
            {!isAllUIHidden && (
                <div className="bottom-left-overlay">
                    <ChatbotTrigger onClick={() => setIsChatbotOpen(prev => !prev)} />
                </div>
            )}

            {isChatbotOpen && (
                <ChatbotPanel
                    onClose={() => setIsChatbotOpen(false)}
                    initialPosition={chatbotState ? { x: chatbotState.x, y: chatbotState.y } : undefined}
                    initialSize={chatbotState ? { width: chatbotState.width, height: chatbotState.height } : undefined}
                    onStateChange={(newState) => setChatbotState(newState)}
                    onNavigateToCharacter={handleNavigateToCharacter}
                    onNavigateToWar={handleNavigateToWar}
                />
            )}

            {/* Event Popup */}
            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />
            )}

            {/* Korean War Day-based Timeline Slider */}
            {isKoreanWarMode && koreanWarFrontlines.length > 0 && (
                <DayTimelineSlider
                    currentDate={currentKoreanWarDate}
                    onDateChange={setCurrentKoreanWarDate}
                    frontlines={koreanWarFrontlines}
                    isPlaying={isKoreanWarPlaying}
                    onPlayPause={() => setIsKoreanWarPlaying(prev => !prev)}
                    speed={koreanWarSpeed}
                    onSpeedChange={setKoreanWarSpeed}
                />
            )}


            {/* Bottom Timeline */}
            <div
                className="bottom-bar"
            >
                {/* TimeControl with PlayControls inside */}
                {!isAllUIHidden && (
                    <div style={{
                        position: 'fixed',
                        bottom: timelineVisibility === 'full' ? '210px' : timelineVisibility === 'no-events' ? '98px' : '-60px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 901,
                        transition: 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                        <TimeControls currentYear={currentYear} onYearChange={handleYearChange}>
                            <PlayControls
                                isPlaying={isPlaying}
                                speed={speed}
                                onTogglePlay={() => setIsPlaying(!isPlaying)}
                                onToggleSpeed={toggleSpeed}
                            />
                        </TimeControls>
                    </div>
                )}

                <Timeline
                    currentYear={currentYear}
                    onYearChange={handleYearChange}
                    onEventClick={setSelectedEvent}
                    isVisible={isUIVisible}
                    onIncreaseVisibility={handleTimelineIncrease}
                    onDecreaseVisibility={handleTimelineDecrease}
                    showEvents={timelineVisibility === 'full'}
                    timelineVisibility={timelineVisibility}
                />
            </div>

            {/* Cloud Transition Effect */}
            {/* Cloud Transition Effect */}
            <CloudTransition
                isActive={isCloudTransitionActive}
                onAnimationComplete={handleTransitionComplete}
            />

            {/* Falling Bomb Animation */}
            {showHiroshimaBomb && (
                <FallingBomb
                    onImpact={handleHiroshimaBombImpact}
                    targetScreenPos={hiroshimaScreenPos}
                    mapZoom={currentMapZoom}
                />
            )}

            {showNagasakiBomb && (
                <FallingBomb
                    onImpact={handleNagasakiBombImpact}
                    targetScreenPos={nagasakiScreenPos}
                    mapZoom={currentMapZoom}
                />
            )}

            {/* Nuke Explosion Effects */}
            {explosions.map(ex => (
                <NukeExplosion
                    key={ex.id}
                    x={ex.x}
                    y={ex.y}
                    scale={ex.scale}
                    onComplete={() => removeExplosion(ex.id)}
                />
            ))}
        </div>
    );
}

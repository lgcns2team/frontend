import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HistoryMap.css';
import '../../../shared/config/era-theme.css';
// import { capitalData } from '../../../shared/data/capitals'; // Deprecated in favor of history-timeline.json
import { battleData } from '../../../shared/data/battles';
import { tradeData } from '../../../shared/data/trade';
import { peopleData } from '../../../shared/data/people';

import { getEraForYear } from '../../../shared/config/era-theme';
import { loadHistoricalBorders } from '../lib/boundary-utils';
import { loadTradeRoutes, getTradeRouteStyle } from '../lib/trade-route';

// Features
import { TimeControls } from '../../../features/time-controls';
import { MapLayers } from '../../../features/map-layers';
import { SearchYear } from '../../../features/search-year';
import { SidebarMenu } from '../../../features/sidebar-menu';
import { Timeline } from '../../../features/timeline';
import { DockingPanel } from '../../../features/docking-panel/ui/DockingPanel';
import { FloatingPanel } from '../../../features/floating-panel/ui/FloatingPanel';
import { ChatbotTrigger, ChatbotPanel } from '../../../features/chatbot';
import { TextbookPanel } from '../../../features/textbook-panel';
import { CloudTransition } from '../../../features/cloud-transition';

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

interface TimelineEvent {
    year: number;
    countryName: string;
    capitalName: string | null;
    capitalLatitude: number | null;
    capitalLongitude: number | null;
    regnalName: string | null;
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
    const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);

    // Helper to normalize country names to ID
    const getCountryId = (name: string): string => {
        if (!name) return '';
        const lower = name.toLowerCase();

        // Map Korean names to IDs
        if (lower.includes('고조선') || lower.includes('gojoseon')) return 'GOJOSEON';
        if (lower.includes('고구려') || lower.includes('goguryeo') || lower.includes('koguryo')) return 'GOGURYEO';
        if (lower.includes('백제') || lower.includes('baekje') || lower.includes('paekche')) return 'BAEKJE';
        if (lower.includes('신라') || lower.includes('silla') || lower.includes('silia')) return 'SILLA';
        if (lower.includes('가야') || lower.includes('gaya')) return 'GAYA';
        if (lower.includes('발해') || lower.includes('balhae') || lower.includes('parhae')) return 'BALHAE';
        if (lower.includes('고려') || lower.includes('goryeo')) return 'GORYEO';
        if (lower.includes('조선') || lower.includes('joseon')) return 'JOSEON';

        if (lower.includes('당') || lower.includes('tang')) return 'TANG';
        if (lower.includes('송') || lower.includes('song')) return 'SONG';
        if (lower.includes('원') || lower.includes('yuan') || lower.includes('mongol')) return 'YUAN';
        if (lower.includes('명') || lower.includes('ming')) return 'MING';
        if (lower.includes('청') || lower.includes('qing')) return 'QING';

        if (lower.includes('거란') || lower.includes('요') || lower.includes('khitan') || lower.includes('liao')) return 'LIAO';
        if (lower.includes('여진') || lower.includes('금') || lower.includes('jurchen') || lower.includes('jin')) return 'JIN';
        if (lower.includes('서하') || lower.includes('western xia') || lower.includes('seoha')) return 'WESTERN_XIA';

        if (lower.includes('일본') || lower.includes('japan') || lower.includes('yamato') || lower.includes('wa')) return 'JAPAN';

        // Fallback for exact matches or other cases
        return lower.trim();
    };

    const [currentYear, setCurrentYear] = useState<number>(326);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(1);
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [layerType, setLayerType] = useState<'default' | 'battles' | 'trade' | 'people'>('default');
    const [selectedCountry, setSelectedCountry] = useState<{ name: string; properties: any } | null>(null);
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
    const [pageInput, setPageInput] = useState('');

    // Cloud Transition State
    const [isCloudTransitionActive, setIsCloudTransitionActive] = useState(false);
    const prevEraId = useRef<string>(getEraForYear(currentYear).id);

    const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const getCapitalPeriod = (year: number) => {
        if (year <= -1000) return '-2000_-1000';
        if (year <= -500) return '-1000_-500';
        if (year <= 0) return '-500_0';
        if (year <= 300) return '0_300';
        if (year <= 500) return '300_500';
        if (year <= 700) return '500_700';
        if (year <= 900) return '700_900';
        if (year <= 1100) return '900_1100';
        if (year <= 1300) return '1100_1300';
        if (year <= 1400) return '1300_1400';
        if (year <= 1600) return '1400_1600';
        if (year <= 1800) return '1600_1800';
        if (year <= 1900) return '1800_1900';
        if (year <= 1945) return '1900_1945';
        return '1945_2024';
    };

    // Initialize Map
    useEffect(() => {
        if (!mapContainer.current) return;

        // Initialize map
        map.current = L.map(mapContainer.current, {
            center: [36.5, 127.5],
            zoom: 7,
            zoomControl: false,
            attributionControl: false
        });

        // Add tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(map.current);

        // Initial load
        updateMapForYear(currentYear);

        markersLayer.current = L.layerGroup().addTo(map.current);
        tradeLayer.current = L.layerGroup().addTo(map.current);

        // Load timeline data
        fetch('/assets/images/country-summary/history-timeline.json')
            .then(res => res.json())
            .then(data => {
                setTimelineData(data);
            })
            .catch(err => console.error('Failed to load timeline data:', err));

        return () => {
            map.current?.remove();
        };
    }, []);

    // Update map when year changes with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            updateMapForYear(currentYear);
        }, 100); // 100ms debounce

        // Check for Era Change
        const newEraId = getEraForYear(currentYear).id;
        if (newEraId !== prevEraId.current) {
            setIsCloudTransitionActive(true);
            prevEraId.current = newEraId;
        }

        return () => clearTimeout(timer);
    }, [currentYear]);

    // Update Markers when layer type changes or timeline data loads
    useEffect(() => {
        updateMarkers(currentYear);
    }, [layerType, timelineData]);

    // Update Trade Routes
    useEffect(() => {
        const updateTradeRoutes = async () => {
            if (!map.current || !tradeLayer.current) return;

            const routes = await loadTradeRoutes(currentYear);

            tradeLayer.current.clearLayers();

            if (routes.length > 0) {
                routes.forEach(route => {
                    L.geoJSON(route, {
                        style: getTradeRouteStyle()
                    }).addTo(tradeLayer.current!);
                });
            }
        };

        updateTradeRoutes();
    }, [currentYear]);

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

        try {
            let newLayer: L.Layer | null = null;

            // Check cache first
            if (layerCache.current.has(year)) {
                newLayer = layerCache.current.get(year)!;
                // Note: Cached layers retain their event listeners.
                // However, the 'click' listener closure captures the state at creation time.
                // Since 'setSelectedCountry' is stable, this is fine.
            } else {
                newLayer = await loadHistoricalBorders(year, (name, props) => {
                    setSelectedCountry({ name, properties: props });
                });

                // If aborted during await, stop here
                if (controller.signal.aborted) return;

                if (newLayer) {
                    layerCache.current.set(year, newLayer);
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

        // Always show capitals
        // Always show capitals from timeline data
        if (timelineData.length > 0) {
            // 1. Identify visible countries from the map layer
            const visibleCountryIds = new Set<string>();

            if (historicalLayer.current) {
                // If it's a GeoJSON layer (which it should be)
                (historicalLayer.current as any).eachLayer((layer: any) => {
                    if (layer.feature && layer.feature.properties) {
                        const props = layer.feature.properties;
                        const name = props.NAME || props.name;
                        if (name) {
                            visibleCountryIds.add(getCountryId(name));
                        }
                    }
                });
            }

            // Group by country
            const countries = new Set(timelineData.map(d => d.countryName));

            countries.forEach(country => {
                // Check if this country is visible on the map
                // We check if the normalized ID of the timeline country exists in the visible map features
                const timelineCountryId = getCountryId(country);

                // Special handling: If map has "Tang", timeline "Tang" should show.
                // If map has "Unified Silla" (which might just be "Silla" in GeoJSON), timeline "Unified Silla" should show.
                // The getCountryId helper handles this normalization.

                // If the country is NOT visible on the map, skip it
                // Exception: If we can't find any visible countries (maybe layer hasn't loaded yet?), show all? 
                // No, better to be strict to fix the "ghost marker" issue.
                // However, we need to be careful about name mismatches.

                // Debug log if needed: console.log(`Checking ${country} (${timelineCountryId}) against visible:`, visibleCountryIds);

                if (!visibleCountryIds.has(timelineCountryId)) {
                    // Try loose matching if strict match fails
                    // e.g. "Unified Silla" vs "Silla"
                    let matchFound = false;
                    for (const visibleId of visibleCountryIds) {
                        if (visibleId.includes(timelineCountryId) || timelineCountryId.includes(visibleId)) {
                            matchFound = true;
                            break;
                        }
                    }
                    if (!matchFound) return;
                }

                // Get all events for this country
                const countryEvents = timelineData.filter(d => d.countryName === country);

                // Find the latest event that is <= currentYear
                // Sort by year descending to find the first one <= currentYear
                const activeEvent = countryEvents
                    .sort((a, b) => b.year - a.year)
                    .find(d => d.year <= year);

                // If we found an event, and it has valid coordinates, show it
                if (activeEvent && activeEvent.capitalName && activeEvent.capitalLatitude && activeEvent.capitalLongitude) {
                    // Note: The logic "show until next king" is implicitly handled because we find the *latest* event <= currentYear.
                    // If the next event is in the future, this one remains active.
                    // However, we should check if the country still exists or if there's a "null" entry indicating end?
                    // The data seems to have entries with null capital for some years (e.g. 780 Japan null).
                    // If capitalName is null, we probably shouldn't show a marker.

                    if (activeEvent && activeEvent.capitalName && activeEvent.capitalLatitude && activeEvent.capitalLongitude) {
                        const icon = L.divIcon({
                            className: 'capital-marker',
                            html: `
                            <div style="display: flex; flex-direction: column; align-items: center; width: 100px;">
                                <img src="/assets/images/country-summary/sudo.png" style="width: 40px; height: 40px; object-fit: contain;" />
                                <div style="font-size: 14px; font-weight: bold; color: white; margin-top: 2px; text-align: center; width: 100%; white-space: nowrap;">${activeEvent.capitalName}</div>
                            </div>
                        `,
                            iconSize: [100, 60],
                            iconAnchor: [50, 20] // Anchor at center of image (approx)
                        });

                        const popupContent = `
                        <div style="text-align: center;">
                            <h3 style="margin: 0 0 5px 0;">${activeEvent.countryName}</h3>
                            <p style="margin: 0;">수도: ${activeEvent.capitalName}</p>
                            ${activeEvent.regnalName ? `<p style="margin: 5px 0 0 0;"><strong>${activeEvent.regnalName}</strong></p>` : ''}
                        </div>
                    `;

                        L.marker([activeEvent.capitalLatitude, activeEvent.capitalLongitude], { icon })
                            .addTo(markersLayer.current!)
                            .bindPopup(popupContent);
                    }
                }
            });
        }

        // Show other layers
        const periodKey = getCapitalPeriod(year);

        if (layerType === 'battles') {
            const battles = battleData[periodKey];
            if (battles) {
                battles.forEach(battle => {
                    const icon = L.divIcon({
                        className: 'battle-marker',
                        html: `
                            <div class="event-marker-content">
                                <div class="event-icon">⚔️</div>
                                <div class="event-label">${battle.name}</div>
                            </div>
                        `,
                        iconSize: [100, 40],
                        iconAnchor: [50, 20]
                    });
                    L.marker([battle.lat, battle.lng], { icon }).addTo(markersLayer.current!)
                        .bindPopup(`<b>${battle.name} (${battle.year}년)</b><br>${battle.outcome}`);
                });
            }
        } else if (layerType === 'trade') {
            const trades = tradeData[periodKey];
            if (trades) {
                trades.forEach(trade => {
                    const icon = L.divIcon({
                        className: 'trade-marker',
                        html: `
                            <div class="event-marker-content">
                                <div class="event-icon">💰</div>
                                <div class="event-label">${trade.name}</div>
                            </div>
                        `,
                        iconSize: [100, 40],
                        iconAnchor: [50, 20]
                    });
                    L.marker([trade.lat, trade.lng], { icon }).addTo(markersLayer.current!)
                        .bindPopup(`<b>${trade.name}</b><br>물품: ${trade.goods.join(', ')}`);

                    // Draw line
                    if (trade.from && trade.to) {
                        L.polyline([[trade.from.lat, trade.from.lng], [trade.to.lat, trade.to.lng]], {
                            color: '#10b981',
                            dashArray: '5, 10',
                            weight: 2
                        }).addTo(markersLayer.current!);
                    }
                });
            }
        } else if (layerType === 'people') {
            const people = peopleData[periodKey];
            if (people) {
                people.forEach(person => {
                    const icon = L.divIcon({
                        className: 'people-marker',
                        html: `
                            <div class="event-marker-content">
                                <div class="event-icon">👑</div>
                                <div class="event-label">${person.name}</div>
                            </div>
                        `,
                        iconSize: [100, 40],
                        iconAnchor: [50, 20]
                    });
                    L.marker([person.lat, person.lng], { icon }).addTo(markersLayer.current!)
                        .bindPopup(`<b>${person.name}</b><br>${person.title}<br>${person.achievements}`);
                });
            }
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

    // Calculate optimal width for textbook
    const calculateTextbookWidth = (mode: 'single' | 'double') => {
        const headerHeight = 70; // Approximate header height + padding
        const availableHeight = window.innerHeight - headerHeight;
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
        }
    };

    const handleClosePanel = () => {
        setActivePanel(null);
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

    // Textbook Handlers
    const handleTextbookPrev = () => {
        if (textbookViewMode === 'single') {
            setTextbookPage((prev) => Math.max(0, prev - 1));
        } else {
            setTextbookPage((prev) => Math.max(0, prev - 2));
        }
    };

    const handleTextbookNext = () => {
        const totalPages = 220;
        if (textbookViewMode === 'single') {
            setTextbookPage((prev) => Math.min(totalPages - 1, prev + 1));
        } else {
            setTextbookPage((prev) => Math.min(totalPages - 2, prev + 2));
        }
    };

    const toggleTextbookViewMode = () => {
        const newMode = textbookViewMode === 'single' ? 'double' : 'single';
        setTextbookViewMode(newMode);
        // Width update is handled by useEffect
    };

    const handlePageInputSubmit = () => {
        const pageNum = parseInt(pageInput, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= 220) {
            setTextbookPage(pageNum - 1);
            setPageInput('');
        } else {
            alert('1에서 220 사이의 페이지를 입력해주세요.');
        }
    };

    // Dynamic Theme Calculation
    const currentEra = getEraForYear(currentYear);

    const renderTextbookControls = () => {
        const totalPages = 220;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    onClick={handleTextbookPrev}
                    disabled={textbookPage === 0}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: 'var(--ui-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        opacity: textbookPage === 0 ? 0.5 : 1
                    }}
                >
                    이전
                </button>
                <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '60px', textAlign: 'center', color: 'var(--ui-text)' }}>
                    {textbookViewMode === 'single'
                        ? `${textbookPage + 1}p`
                        : `${textbookPage + 1}p - ${textbookPage + 2}p`}
                </span>
                <button
                    onClick={handleTextbookNext}
                    disabled={
                        textbookViewMode === 'single'
                            ? textbookPage === totalPages - 1
                            : textbookPage >= totalPages - 2
                    }
                    style={{
                        padding: '4px 8px',
                        backgroundColor: 'var(--ui-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        opacity: (textbookViewMode === 'single' ? textbookPage === totalPages - 1 : textbookPage >= totalPages - 2) ? 0.5 : 1
                    }}
                >
                    다음
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                    <input
                        type="text"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
                        placeholder="페이지"
                        style={{
                            width: '50px',
                            padding: '4px',
                            borderRadius: '4px',
                            border: '1px solid var(--ui-border)',
                            backgroundColor: 'var(--ui-bg)',
                            color: 'var(--ui-text)',
                            textAlign: 'center'
                        }}
                    />
                    <button
                        onClick={handlePageInputSubmit}
                        style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--ui-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        이동
                    </button>
                </div>

                <button
                    onClick={toggleTextbookViewMode}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--ui-primary)',
                        color: 'var(--ui-primary)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginLeft: '8px'
                    }}
                >
                    {textbookViewMode === 'single' ? '양면보기' : '한면보기'}
                </button>
            </div>
        );
    };

    return (
        <div className={`history-map-container theme-${currentEra.id}`}>
            <div id="map" ref={mapContainer}></div>

            {/* Top Left: Year, Play, Speed, Layers */}
            <div className="top-left-overlay">
                <TimeControls
                    currentYear={currentYear}
                    isPlaying={isPlaying}
                    speed={speed}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    onToggleSpeed={toggleSpeed}
                />

                <MapLayers
                    activeLayer={layerType}
                    onLayerChange={setLayerType}
                    currentYear={currentYear}
                />

                {/* Floating Info Panel (Left) */}
                <FloatingPanel
                    isOpen={!!selectedCountry}
                    onClose={() => setSelectedCountry(null)}
                    title={selectedCountry?.name || '국가 정보'}
                >
                    <div className="country-details">
                        <p><strong>연도:</strong> {currentYear > 0 ? currentYear + '년' : 'BC ' + Math.abs(currentYear) + '년'}</p>
                        {selectedCountry?.properties && (
                            <>
                                {/* Add more properties here as available in GeoJSON */}
                                <p>{selectedCountry.name}에 대한 상세 정보가 여기에 표시됩니다.</p>
                            </>
                        )}
                    </div>
                </FloatingPanel>
            </div>

            {/* Top Right: Search & Menu */}
            <div className="top-right-overlay">
                <SearchYear currentYear={currentYear} />
                <SidebarMenu onItemClick={handleSidebarClick} />
            </div>

            {/* Docking Panel */}
            <DockingPanel
                isOpen={!!activePanel}
                onClose={handleClosePanel}
                title={getPanelTitle(activePanel)}
                initialWidth={800}
                width={activePanel === 'textbook' ? dockingPanelWidth : undefined}
                maxWidth={1600}
                headerRightContent={activePanel === 'textbook' ? renderTextbookControls() : null}
            >
                {activePanel === 'textbook' ? (
                    <TextbookPanel
                        currentPage={textbookPage}
                        viewMode={textbookViewMode}
                    />
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ui-text)' }}>
                        <p>{getPanelTitle(activePanel)} 패널 내용이 여기에 표시됩니다.</p>
                        <p>현재 연도: {currentYear}년</p>
                    </div>
                )}
            </DockingPanel>

            {/* Bottom Left: Chatbot */}
            <div className="bottom-left-overlay">
                <ChatbotTrigger onClick={() => setIsChatbotOpen(prev => !prev)} />
            </div>

            {isChatbotOpen && (
                <ChatbotPanel
                    onClose={() => setIsChatbotOpen(false)}
                    initialPosition={chatbotState ? { x: chatbotState.x, y: chatbotState.y } : undefined}
                    initialSize={chatbotState ? { width: chatbotState.width, height: chatbotState.height } : undefined}
                    onStateChange={(newState) => setChatbotState(newState)}
                />
            )}



            {/* Bottom Timeline */}
            <div
                className="bottom-bar"
                style={{
                    backgroundImage: `url("${currentEra.timelineImage || '/assets/images/timecontrols/durumagi.png'}")`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <Timeline
                    currentYear={currentYear}
                    onYearChange={handleYearChange}
                />
            </div>

            {/* Cloud Transition Effect */}
            <CloudTransition
                isActive={isCloudTransitionActive}
                onAnimationComplete={() => setIsCloudTransitionActive(false)}
            />
        </div>
    );
}

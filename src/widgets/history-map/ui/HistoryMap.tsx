import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HistoryMap.css';
import '../../../shared/config/era-theme.css';
import { capitalData } from '../../../shared/data/capitals';
import { battleData } from '../../../shared/data/battles';
import { tradeData } from '../../../shared/data/trade';
import { peopleData } from '../../../shared/data/people';

import { getEraForYear } from '../../../shared/config/era-theme';
import { loadHistoricalBorders } from '../lib/boundary-utils';

// Features
import { TimeControls } from '../../../features/time-controls';
import { MapLayers } from '../../../features/map-layers';
import { SearchYear } from '../../../features/search-year';
import { SidebarMenu } from '../../../features/sidebar-menu';
import { Timeline } from '../../../features/timeline';
import { DockingPanel } from '../../../features/docking-panel/ui/DockingPanel';
import { ChatbotTrigger } from '../../../features/chatbot/ui/ChatbotTrigger';

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

export default function HistoryMap() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<L.Map | null>(null);
    const historicalLayer = useRef<L.Layer | null>(null);
    const markersLayer = useRef<L.LayerGroup | null>(null);

    const [currentYear, setCurrentYear] = useState<number>(475);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(1);
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [layerType, setLayerType] = useState<'default' | 'battles' | 'trade' | 'people'>('default');

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

        return () => {
            map.current?.remove();
        };
    }, []);

    // Update map when year changes
    useEffect(() => {
        updateMapForYear(currentYear);
    }, [currentYear]);

    // Update Markers when layer type changes
    useEffect(() => {
        updateMarkers(currentYear);
    }, [layerType]);

    const updateMapForYear = async (year: number) => {
        if (!map.current) return;

        try {
            // Load new boundary layer
            const newLayer = await loadHistoricalBorders(year);

            if (newLayer) {
                // Remove existing layer
                if (historicalLayer.current) {
                    map.current.removeLayer(historicalLayer.current);
                }

                // Add new layer
                newLayer.addTo(map.current);
                historicalLayer.current = newLayer;
            }

            // Update markers based on year
            updateMarkers(year);
        } catch (error) {
            console.error('Failed to load historical data:', error);
        }
    };

    const updateMarkers = (year: number) => {
        if (!markersLayer.current || !map.current) return;

        markersLayer.current.clearLayers();

        // Always show capitals
        const periodKey = getCapitalPeriod(year);
        const capitals = capitalData[periodKey];

        if (capitals) {
            capitals.forEach(capital => {
                const icon = L.divIcon({
                    className: 'capital-marker',
                    html: `<div style="font-size: 14px; text-shadow: 2px 2px 2px white;">⭐ ${capital.capital}</div>`,
                    iconSize: [100, 20],
                    iconAnchor: [50, 10]
                });

                L.marker([capital.lat, capital.lng], { icon }).addTo(markersLayer.current!)
                    .bindPopup(`<b>${capital.country}</b><br>수도: ${capital.capital}`);
            });
        }

        // Show other layers
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

    // Panel Handlers
    const handleSidebarClick = (id: string) => {
        setActivePanel(prev => prev === id ? null : id);
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

    // Dynamic Theme Calculation
    const currentEra = getEraForYear(currentYear);

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
                />
            </div>

            {/* Top Right: Search */}
            <div className="top-right-overlay">
                <SearchYear />
            </div>

            {/* Right Sidebar Menu */}
            <div className="right-sidebar">
                <SidebarMenu onItemClick={handleSidebarClick} />
            </div>

            {/* Docking Panel */}
            <DockingPanel
                isOpen={!!activePanel}
                onClose={handleClosePanel}
                title={getPanelTitle(activePanel)}
            >
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ui-text)' }}>
                    <p>{getPanelTitle(activePanel)} 패널 내용이 여기에 표시됩니다.</p>
                    <p>현재 연도: {currentYear}년</p>
                </div>
            </DockingPanel>

            {/* Bottom Timeline */}
            <div className="bottom-bar">
                <div className="bottom-left-group">
                    <ChatbotTrigger />
                </div>
                <Timeline
                    currentYear={currentYear}
                    onYearChange={handleYearChange}
                />
            </div>
        </div>
    );
}

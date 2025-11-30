import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import './HistoryMap.css';
import { capitalData } from '../../../shared/data/capitals';
import { battleData } from '../../../shared/data/battles';
import { tradeData } from '../../../shared/data/trade';
import { peopleData } from '../../../shared/data/people';

import { loadHistoricalBorders } from '../lib/boundary-utils';
import { getEraForYear } from '../../../shared/config/eras';

// Features
import { TimeControls } from '../../../features/time-controls';
import { MapLayers } from '../../../features/map-layers';
import { SearchYear } from '../../../features/search-year';
import { SidebarMenu } from '../../../features/sidebar-menu';
import { Timeline } from '../../../features/timeline';
import { ChatbotTrigger } from '../../../features/chatbot';

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

const HistoryMap = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const historicalLayer = useRef<L.Layer | null>(null);
    const markersLayer = useRef<L.LayerGroup | null>(null);

    const [currentYear, setCurrentYear] = useState<number>(475);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(1);
    const [layerType, setLayerType] = useState<'default' | 'battles' | 'trade' | 'people'>('default');

    const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initialize Map
    useEffect(() => {
        if (mapContainer.current && !mapInstance.current) {
            const map = L.map(mapContainer.current, {
                center: [37.5, 120.0],
                zoom: 5,
                zoomControl: false,
                maxZoom: 10,
                minZoom: 3
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                opacity: 0.3
            }).addTo(map);

            mapInstance.current = map;
            markersLayer.current = L.layerGroup().addTo(map);
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Load GeoJSON
    useEffect(() => {
        if (!mapInstance.current) return;

        const updateBorders = async () => {
            const newLayer = await loadHistoricalBorders(currentYear);
            if (newLayer) {
                if (historicalLayer.current) {
                    mapInstance.current?.removeLayer(historicalLayer.current);
                }
                newLayer.addTo(mapInstance.current!);
                historicalLayer.current = newLayer;
            }
        };

        updateBorders();
        updateMarkers();

    }, [currentYear]);

    // Update Markers when year or layer type changes
    useEffect(() => {
        updateMarkers();
    }, [layerType, currentYear]);

    // Auto Play
    useEffect(() => {
        if (isPlaying) {
            const intervalMs = 500 / speed;
            playInterval.current = setInterval(() => {
                setCurrentYear(prev => {
                    const next = prev + 1;
                    if (next > 2024) return 475; // Loop back
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
        setSpeed(prev => {
            if (prev >= 16) return 1;
            return prev * 2;
        });
    };

    const updateMarkers = () => {
        if (!mapInstance.current || !markersLayer.current) return;

        markersLayer.current.clearLayers();

        // Always show capitals
        const periodKey = getCapitalPeriod(currentYear);
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

    // Helpers
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

    // Dynamic Theme Calculation
    const currentEra = getEraForYear(currentYear);

    return (
        <div className={`history-map-container theme-${currentEra.id}`}>
            <div id="map" ref={mapContainer}></div>

            {/* Top Left: Year, Play, Speed, Layers */}
            <div className="ui-overlay top-left">
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
            <div className="ui-overlay top-right">
                <SearchYear />
            </div>

            {/* Right Sidebar: Features */}
            <div className="ui-overlay right-sidebar">
                <SidebarMenu />
            </div>

            {/* Bottom: Chatbot & Timeline */}
            <div className="ui-overlay bottom-bar">
                <div className="bottom-left-group">
                    <ChatbotTrigger />
                </div>

                <Timeline
                    currentYear={currentYear}
                    onYearChange={setCurrentYear}
                />
            </div>
        </div>
    );
};

export default HistoryMap;

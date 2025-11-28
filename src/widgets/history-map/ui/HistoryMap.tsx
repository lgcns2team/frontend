import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import './HistoryMap.css';
import {
    capitalData,
    battleData,
    tradeData,
    peopleData
} from '../../../shared/config/constants';

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
    const [layerType, setLayerType] = useState<'default' | 'battles' | 'trade' | 'people'>('default');

    const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // ... (previous imports)

    // Initialize Map
    useEffect(() => {
        if (mapContainer.current && !mapInstance.current) {
            const map = L.map(mapContainer.current, {
                center: [37.5, 120.0],
                zoom: 5,
                zoomControl: true,
                maxZoom: 10,
                minZoom: 3
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                opacity: 0.3
            }).addTo(map);

            // FeatureGroup is to store editable layers
            const drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);

            // Cast L to any to avoid TypeScript errors with leaflet-draw
            const drawControl = new (L.Control as any).Draw({
                edit: {
                    featureGroup: drawnItems
                },
                draw: {
                    polygon: true,
                    polyline: true,
                    rectangle: true,
                    circle: true,
                    marker: true,
                    circlemarker: false
                }
            });
            map.addControl(drawControl);

            map.on((L as any).Draw.Event.CREATED, function (e: any) {
                const layer = e.layer;
                drawnItems.addLayer(layer);
            });

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

        const loadMapData = async () => {
            const file = getGeojsonFileForYear(currentYear);
            try {
                // Use fetch instead of d3.json to ensure correct path resolution in Vite
                const response = await fetch(`/${file}`);
                if (!response.ok) throw new Error('Failed to load GeoJSON');
                const data = await response.json();

                if (data) {
                    // Filter features for East Asia
                    const filteredFeatures = data.features.filter((feature: any) => {
                        if (!feature.geometry || !feature.geometry.coordinates) return false;
                        try {
                            // Simple bounding box check based on first coordinate
                            let coords = feature.geometry.coordinates;
                            let checkCoord;
                            if (feature.geometry.type === 'Polygon') {
                                checkCoord = coords[0][0];
                            } else if (feature.geometry.type === 'MultiPolygon') {
                                checkCoord = coords[0][0][0];
                            }

                            if (checkCoord) {
                                const [lng, lat] = checkCoord;
                                return lng >= 70 && lng <= 150 && lat >= 15 && lat <= 60;
                            }
                        } catch (e) {
                            return false;
                        }
                        return false;
                    });

                    const filteredData = {
                        type: 'FeatureCollection',
                        features: filteredFeatures.length > 0 ? filteredFeatures : data.features // Fallback if filter fails
                    };

                    const newLayer = L.geoJSON(filteredData as any, {
                        style: function (feature: any) {
                            return {
                                fillColor: getColorByCountry(feature?.properties?.NAME || feature?.properties?.name),
                                weight: 1,
                                opacity: 1,
                                color: '#ffffff',
                                fillOpacity: 0.5,
                            };
                        },
                        onEachFeature: function (feature: any, layer: L.Layer) {
                            if (feature.properties && (feature.properties.NAME || feature.properties.name)) {
                                const countryName = feature.properties.NAME || feature.properties.name;
                                const displayName = countryName === 'gojoseon' ? '고조선' : countryName;

                                layer.bindPopup(
                                    `<div style="font-family: sans-serif; padding: 8px;">
                                        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">${displayName}</h3>
                                        <p style="margin: 0; font-size: 13px; color: #6b7280;">${currentYear > 0 ? currentYear + '년' : 'BC ' + Math.abs(currentYear) + '년'}</p>
                                    </div>`
                                );

                                layer.on('mouseover', function (e: any) {
                                    e.target.setStyle({
                                        weight: 3,
                                        color: '#3b82f6',
                                        fillOpacity: 0.75
                                    });
                                    e.target.bringToFront();
                                });

                                layer.on('mouseout', function (e: any) {
                                    if (newLayer) {
                                        newLayer.resetStyle(e.target);
                                    }
                                });
                            }
                        }
                    });

                    if (historicalLayer.current) {
                        mapInstance.current?.removeLayer(historicalLayer.current);
                    }

                    newLayer.addTo(mapInstance.current!);
                    historicalLayer.current = newLayer;
                }
            } catch (error) {
                console.error('Error loading map data:', error);
            }
        };

        loadMapData();
        updateMarkers();

    }, [currentYear]);

    // Update Markers when year or layer type changes
    useEffect(() => {
        updateMarkers();
    }, [layerType, currentYear]);

    // Auto Play
    useEffect(() => {
        if (isPlaying) {
            playInterval.current = setInterval(() => {
                setCurrentYear(prev => {
                    const next = prev + 1;
                    if (next > 2024) return 475; // Loop back
                    return next;
                });
            }, 500);
        } else {
            if (playInterval.current) {
                clearInterval(playInterval.current);
                playInterval.current = null;
            }
        }
        return () => {
            if (playInterval.current) clearInterval(playInterval.current);
        };
    }, [isPlaying]);

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
    const getGeojsonFileForYear = (year: number) => {
        if (year >= 929 && year <= 936) return 'geojson/map-data.geojson';
        if (year <= -1000) return 'geojson/world_bc1000.geojson';
        if (year <= -500) return 'geojson/world_bc500.geojson';
        if (year <= 0) return 'geojson/world_bc1.geojson';
        if (year <= 100) return 'geojson/world_100.geojson';
        if (year <= 300) return 'geojson/world_200.geojson'; // Approx
        if (year <= 500) return 'geojson/world_400.geojson'; // Approx
        if (year <= 700) return 'geojson/world_600.geojson'; // Approx
        if (year <= 900) return 'geojson/world_800.geojson'; // Approx
        if (year <= 1100) return 'geojson/world_1100.geojson'; // Approx
        if (year <= 1300) return 'geojson/world_1300.geojson';
        if (year <= 1400) return 'geojson/world_1400.geojson';
        if (year <= 1500) return 'geojson/world_1500.geojson';
        if (year <= 1600) return 'geojson/world_1600.geojson';
        if (year <= 1700) return 'geojson/world_1650.geojson';
        if (year <= 1800) return 'geojson/world_1783.geojson';
        if (year <= 1900) return 'geojson/world_1880.geojson';
        if (year <= 1920) return 'geojson/world_1914.geojson';
        if (year <= 1940) return 'geojson/world_1938.geojson';
        if (year <= 1960) return 'geojson/world_1945.geojson';
        if (year <= 2000) return 'geojson/world_1994.geojson';
        return 'geojson/world_2010.geojson';
    };

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

    const getColorByCountry = (name: string) => {
        const colors: Record<string, string> = {
            '고조선': '#7c3aed', 'gojoseon': '#7c3aed',
            '고구려': '#ef4444', 'Goguryeo': '#ef4444',
            '백제': '#3b82f6', 'Baekje': '#3b82f6',
            '신라': '#f59e0b', 'Silla': '#f59e0b',
            '고려': '#8b5cf6', 'Goryeo': '#8b5cf6',
            '조선': '#10b981', 'Joseon': '#10b981',
            '일본': '#dc2626', 'Japan': '#dc2626',
            '중국': '#ea580c', 'China': '#ea580c',
            '당': '#f97316', 'Tang': '#f97316',
            '청': '#0ea5e9', 'Qing': '#0ea5e9',
            '명': '#eab308', 'Ming': '#eab308'
        };

        if (name) {
            for (let key in colors) {
                if (name.includes(key)) return colors[key];
            }
        }
        return '#94a3b8'; // Default
    };

    return (
        <div className="history-map-container">
            <div id="map" ref={mapContainer}></div>

            {/* Top Left: Year, Play, Speed, Layers */}
            <div className="ui-overlay top-left">
                <div className="control-row">
                    <div className="year-display-box">
                        {currentYear > 0 ? `${currentYear}년` : `BC ${Math.abs(currentYear)}년`} {getCapitalPeriod(currentYear).split('_')[0] !== '1945' ? '고려시대' : '현대'} {/* Placeholder era name */}
                    </div>
                    <div className="playback-controls">
                        <button className="circle-btn play-btn" onClick={() => setIsPlaying(!isPlaying)}>
                            {isPlaying ? '⏸' : '▶'}
                        </button>
                        <button className="circle-btn speed-btn">1x</button>
                    </div>
                </div>
                <div className="layer-tabs">
                    <button
                        className={`tab-btn ${layerType === 'battles' ? 'active' : ''}`}
                        onClick={() => setLayerType(layerType === 'battles' ? 'default' : 'battles')}
                    >
                        전쟁/동맹
                    </button>
                    <button
                        className={`tab-btn ${layerType === 'trade' ? 'active' : ''}`}
                        onClick={() => setLayerType(layerType === 'trade' ? 'default' : 'trade')}
                    >
                        무역
                    </button>
                    <button
                        className={`tab-btn ${layerType === 'people' ? 'active' : ''}`}
                        onClick={() => setLayerType(layerType === 'people' ? 'default' : 'people')}
                    >
                        종교/문화
                    </button>
                </div>
            </div>

            {/* Top Right: Search */}
            <div className="ui-overlay top-right">
                <div className="search-box">
                    <input type="text" placeholder="연도 검색" />
                    <button className="search-btn">🔍</button>
                </div>
            </div>

            {/* Right Sidebar: Features */}
            <div className="ui-overlay right-sidebar">
                <button className="feature-btn">주요사건</button>
                <button className="feature-btn">교과서</button>
                <button className="feature-btn">인물</button>
                <button className="feature-btn">토론</button>
            </div>

            {/* Bottom: Chatbot & Timeline */}
            <div className="ui-overlay bottom-bar">
                <div className="bottom-left-group">
                    <button className="ai-chat-btn">
                        <div className="ai-icon">AI</div>
                        <span>챗봇</span>
                    </button>
                    <button className="nav-btn prev-btn" onClick={() => setCurrentYear(prev => prev - 10)}>
                        ◀
                    </button>
                </div>

                <div className="timeline-wrapper">
                    <div className="timeline-slider-container">
                        <input
                            type="range"
                            min="-2333"
                            max="2024"
                            value={currentYear}
                            className="timeline-slider"
                            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                        />
                        <div className="timeline-track-bg"></div>
                    </div>
                    <div className="timeline-labels">
                        <span>BC 2000</span>
                        <span>BC 500</span>
                        <span>0</span>
                        <span>500</span>
                        <span>1000</span>
                        <span>1500</span>
                        <span>2024</span>
                    </div>
                </div>

                <button className="nav-btn next-btn" onClick={() => setCurrentYear(prev => prev + 10)}>
                    ▶
                </button>
            </div>
        </div>
    );
};

export default HistoryMap;


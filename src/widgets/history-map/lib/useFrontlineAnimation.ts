import { useEffect, useRef, useState, useCallback } from 'react';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import {
    fetchKoreanWarData,
    getBattlesForDate,
    getActiveMovements,
    type KoreanWarData,
    type KoreanWarBattle,
    type KoreanWarMovement
} from '../../../shared/api/korean-war-api';
import { interpolateCatmullRom } from './math-utils';

interface AirRaid {
    id: number;
    type: 'jet' | 'bomber' | 'dogfight' | 'battleship';
    startPos: number[]; // [lng, lat]
    endPos: number[];   // [lng, lat]
    startTime: number;
    duration: number;
    rotation: number;
    marker?: L.Marker; // Persistent marker reference
}




interface UseFrontlineAnimationProps {
    map: L.Map | null;
    isActive: boolean;
    currentDate: string; // "1950-06-25" format
    animationSpeed: number; // 1 = normal speed
    currentZoom?: number;
}

// Korean peninsula polygon (simplified)
let peninsulaPolygon: any = null;

// Load peninsula polygon once
const loadPeninsulaPolygon = async () => {
    if (peninsulaPolygon) return peninsulaPolygon;

    try {
        const response = await fetch('/geojson/korean_peninsula.geojson');
        const data = await response.json();
        if (data.features && data.features[0]) {
            peninsulaPolygon = data.features[0];
        }
    } catch (e) {
        console.error('Failed to load Korean peninsula polygon:', e);
    }
    return peninsulaPolygon;
};

// Helper: Resample extensive geometry to N points for interpolation
const resampleLine = (coords: number[][], points: number): number[][] => {
    if (coords.length < 2) return coords;
    try {
        const line = turf.lineString(coords);
        const length = turf.length(line);
        const step = length / (points - 1);
        const resampled: number[][] = [];

        for (let i = 0; i < points; i++) {
            const dist = i * step;
            const point = turf.along(line, dist);
            resampled.push(point.geometry.coordinates);
        }
        return resampled;
    } catch (e) {
        console.error('Resample error:', e);
        return coords;
    }
};

// Helper: Interpolate between two lines
const interpolateLines = (
    line1: number[][],
    line2: number[][],
    t: number
): number[][] => {
    if (!line1 || !line2) return line1 || line2;

    // Resample both to same number of points (e.g., 200) for smooth morphing
    const SAMPLES = 200;
    const resampled1 = resampleLine(line1, SAMPLES);
    const resampled2 = resampleLine(line2, SAMPLES);

    return resampled1.map((p1, i) => {
        const p2 = resampled2[i] || p1;
        return [
            p1[0] + (p2[0] - p1[0]) * t,
            p1[1] + (p2[1] - p1[1]) * t
        ];
    });
};

export const useFrontlineAnimation = ({
    map,
    isActive,
    currentDate,
    animationSpeed = 1,
    currentZoom = 6
}: UseFrontlineAnimationProps) => {
    const frontlineLayer = useRef<L.LayerGroup | null>(null);
    const territoryLayer = useRef<L.LayerGroup | null>(null);
    const battleLayer = useRef<L.LayerGroup | null>(null);
    const movementLayer = useRef<L.LayerGroup | null>(null);
    const soldierLayer = useRef<L.LayerGroup | null>(null);

    const [warData, setWarData] = useState<KoreanWarData | null>(null);
    const [peninsula, setPeninsula] = useState<any>(null);
    const animationRef = useRef<number | null>(null);

    // USAF Air Raids
    const airRaidLayer = useRef<L.LayerGroup | null>(null);
    const airRaidsRef = useRef<AirRaid[]>([]);
    const lastRaidTimeRef = useRef<number>(0);
    const battleshipRef = useRef<AirRaid | null>(null); // Track battleship instance
    const currentFrontlinePointsRef = useRef<number[][]>([]);



    // Soldier icon definition (Animated North)
    const soldierIconNorth = L.divIcon({
        className: 'soldier-icon-north-anim',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });



    // Soldier icon definition (Animated South)
    const soldierIconSouth = L.divIcon({
        className: 'soldier-icon-south-anim',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });


    // --- Configuration Constants ---
    const JET_SIZE: L.PointTuple = [70, 70];
    const BOMBER_SIZE: L.PointTuple = [100, 100];
    const DOGFIGHT_SIZE: L.PointTuple = [50, 50];
    const BATTLESHIP_SIZE: L.PointTuple = [120, 120];


    // Load Korean War data and peninsula polygon
    useEffect(() => {
        fetchKoreanWarData().then(setWarData);
        loadPeninsulaPolygon().then(setPeninsula);
    }, []);

    // Create panes for layering
    useEffect(() => {
        if (!map) return;

        // Territory pane (lowest, behind frontline)
        const panes = [
            { name: 'territoryPane', zIndex: 350 },
            { name: 'frontlinePane', zIndex: 450 },
            { name: 'soldierPane', zIndex: 460 },
            { name: 'koreanWarBattlePane', zIndex: 550 }
        ];

        panes.forEach(pane => {
            if (!map.getPane(pane.name)) {
                map.createPane(pane.name);
                map.getPane(pane.name)!.style.zIndex = pane.zIndex.toString();
            }
        });

        // Initialize layers
        frontlineLayer.current = L.layerGroup().addTo(map);
        territoryLayer.current = L.layerGroup().addTo(map);
        soldierLayer.current = L.layerGroup().addTo(map);
        battleLayer.current = L.layerGroup().addTo(map);
        movementLayer.current = L.layerGroup().addTo(map);
        airRaidLayer.current = L.layerGroup().addTo(map); // Add air raid layer

        return () => {
            frontlineLayer.current?.remove();
            territoryLayer.current?.remove();
            soldierLayer.current?.remove();
            battleLayer.current?.remove();
            movementLayer.current?.remove();
            airRaidLayer.current?.remove();
        };
    }, [map]);

    // Control layer visibility based on zoom level
    useEffect(() => {
        if (!map) return;

        const layers = [
            frontlineLayer.current,
            territoryLayer.current,
            soldierLayer.current,
            battleLayer.current,
            movementLayer.current,
            airRaidLayer.current
        ];

        // Show/hide based on isActive AND zoom level > 4
        // (Same logic as useWarAnimation)
        const shouldShow = isActive && currentZoom > 4;

        layers.forEach(layer => {
            if (!layer) return;

            if (shouldShow) {
                if (!map.hasLayer(layer)) {
                    map.addLayer(layer);
                }
            } else {
                if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            }
        });
    }, [map, isActive, currentZoom]);

    // Clip peninsula polygon by frontline for north/south territories
    const clipTerritoryByFrontline = useCallback((
        peninsulaGeom: any,
        frontlineCoords: number[][],
        side: 'north' | 'south'
    ): any => {
        try {
            if (!frontlineCoords || frontlineCoords.length < 2) return null;

            const startPt = frontlineCoords[0];
            const endPt = frontlineCoords[frontlineCoords.length - 1];

            // Threshold to distinguish if the line starts on West Coast or inland/South Coast (Pusan)
            // Masan is ~128.5, West Coast is ~125-126.
            const WEST_COAST_THRESHOLD = 127.5;
            const isStartEast = startPt[0] > WEST_COAST_THRESHOLD;

            // Bounding Box Corners
            const NW = [122.0, 44.0];
            const NE = [132.0, 44.0];
            const SE = [132.0, 32.0];
            const SW = [122.0, 32.0];

            let clipRing: number[][] = [];

            if (side === 'north') {
                // North: frontline (reversed End->Start) + closing path
                clipRing = [...frontlineCoords.slice().reverse()];

                // If Pusan (Start is East), we MUST include SW corner to capture the West/Jeolla region for North
                if (isStartEast) {
                    clipRing.push(SW);
                }
                clipRing.push(NW);
                clipRing.push(NE);
                // Loop closes automatically by polygon logic, but connecting back to End (first point of ring) helps
                clipRing.push(endPt);

            } else {
                // South: frontline (Start->End) + closing path
                clipRing = [...frontlineCoords];

                clipRing.push(SE);

                // If Normal War (Start is West), we need SW corner to capture the West/Jeolla region for South?
                // Wait for South Polygon:
                // Normal: Start(West) -> ... -> End(East) -> SE -> SW -> Start(West). (Includes West)
                // Pusan: Start(Masan) -> ... -> End(Pohang) -> SE -> Start(Masan). (Excludes West/SW)
                if (!isStartEast) {
                    clipRing.push(SW);
                }
                clipRing.push(startPt);
            }

            const clipPolygon = turf.polygon([clipRing]);
            const clipped = turf.intersect(
                turf.featureCollection([peninsulaGeom, clipPolygon])
            );

            if (clipped && (clipped.geometry.type === 'Polygon' || clipped.geometry.type === 'MultiPolygon')) {
                return clipped;
            }
        } catch (e) {
            // console.error('Failed to clip territory:', e);
        }
        return null;
    }, []);

    // Draw frontline, territories and soldiers
    const drawFrontline = useCallback((coords: number[][]) => {
        if (!map || !frontlineLayer.current || !territoryLayer.current || !soldierLayer.current) return;

        frontlineLayer.current.clearLayers();
        territoryLayer.current.clearLayers();
        soldierLayer.current.clearLayers();

        const latLngs = coords.map(c => [c[1], c[0]] as [number, number]);

        // Smooth the frontline
        const smoothedLatLngs = interpolateCatmullRom(latLngs);
        const smoothedCoords = smoothedLatLngs.map(ll => [ll[1], ll[0]]);

        // Filter smoothed dashed line to land only (prevent sea extension)
        const landClippedLatLngs = smoothedLatLngs.filter(ll => {
            if (!peninsula) return true;
            return turf.booleanPointInPolygon([ll[1], ll[0]], peninsula);
        });

        // If filtering breaks the line too much (gaps), we might need multiple polylines, 
        // but for now assume contiguous land-based frontline.
        // Fallback to original if aggressive filtering removes everything (edge case)
        const lineToDraw = landClippedLatLngs.length > 1 ? landClippedLatLngs : smoothedLatLngs;

        // Draw frontline line
        L.polyline(lineToDraw, {
            color: '#ffffff',
            opacity: 0.9,
            weight: 4,
            dashArray: '10, 8',
            pane: 'frontlinePane',
            className: 'frontline-line'
        }).addTo(frontlineLayer.current);

        // Add glow effect
        L.polyline(smoothedLatLngs, {
            color: '#ffcc00',
            weight: 8,
            opacity: 0.4,
            pane: 'frontlinePane'
        }).addTo(frontlineLayer.current);

        // --- Draw Soldiers ---
        try {
            const line = turf.lineString(smoothedCoords);
            const length = turf.length(line, { units: 'kilometers' });

            // Interval for flags (decreased for dense line, but not too dense)
            const SOLDIER_INTERVAL = 20; // km (was 2, originally 40)
            // Offset from the center line
            const OFFSET_DIST = 15; // km

            const count = Math.floor(length / SOLDIER_INTERVAL);

            // We skip the very start/end to avoid edge artifacts
            for (let i = 1; i < count; i++) {
                const dist = i * SOLDIER_INTERVAL;

                // Center point on the line
                const pCenter = turf.along(line, dist, { units: 'kilometers' });

                // Calculate local bearing to find perpendicular direction
                const distNext = Math.min(dist + 1, length);
                const pNext = turf.along(line, distNext, { units: 'kilometers' });

                // Bearing in degrees (-180 to 180)
                const bearing = turf.bearing(pCenter, pNext);

                // Calculate two candidate points: Left (+90) and Right (-90) relative to heading
                const p1 = turf.destination(pCenter, OFFSET_DIST, bearing + 90, { units: 'kilometers' });
                const p2 = turf.destination(pCenter, OFFSET_DIST, bearing - 90, { units: 'kilometers' });

                if (!p1 || !p2) continue;

                // --- 국기 마커 임시 비활성화 (테스트용) - 변수 선언도 주석 처리 ---
                // Heuristic to decide which is "North" (North Korea) vs "South" (South Korea/UN)
                // Generally, NK is North/West.
                // let pNorth, pSouth;
                // const c1 = p1.geometry.coordinates;
                // const c2 = p2.geometry.coordinates;

                // Check Latitude first
                // if (Math.abs(c1[1] - c2[1]) > 0.005) { // Significant lat diff
                //     if (c1[1] > c2[1]) {
                //         pNorth = p1;
                //         pSouth = p2;
                //     } else {
                //         pNorth = p2;
                //         pSouth = p1;
                //     }
                // } else {
                //     // Lat similar, check Longitude (West is usually NK in this context)
                //     if (c1[0] < c2[0]) {
                //         pNorth = p1; // p1 is West
                //         pSouth = p2;
                //     } else {
                //         pNorth = p2;
                //         pSouth = p1;
                //     }
                // }

                // --- 국기 마커 임시 비활성화 (테스트용) ---
                // Render North Flag if on land
                // const nPos = pNorth.geometry.coordinates;
                // if (!peninsula || turf.booleanPointInPolygon(pNorth, peninsula)) {
                //     L.marker([nPos[1], nPos[0]], {
                //         icon: soldierIconNorth,
                //         pane: 'soldierPane'
                //     }).addTo(soldierLayer.current);
                // }

                // Render South Flag if on land
                // const sPos = pSouth.geometry.coordinates;
                // if (!peninsula || turf.booleanPointInPolygon(pSouth, peninsula)) {
                //     L.marker([sPos[1], sPos[0]], {
                //         icon: soldierIconSouth,
                //         pane: 'soldierPane'
                //     }).addTo(soldierLayer.current);
                // }
            }

        } catch (e) {
            console.warn('Failed to place soldiers:', e);
        }

        // --- Draw Territories ---
        if (peninsula) {
            // North
            const northClipped = clipTerritoryByFrontline(peninsula, smoothedCoords, 'north');
            if (northClipped) {
                L.geoJSON(northClipped as any, {
                    style: {
                        fillColor: '#ef4444',
                        fillOpacity: 0.35,
                        weight: 2,
                        color: '#ef4444',
                        opacity: 0.6
                    },
                    pane: 'territoryPane'
                }).addTo(territoryLayer.current);
            }

            // South
            const southClipped = clipTerritoryByFrontline(peninsula, smoothedCoords, 'south');
            if (southClipped) {
                L.geoJSON(southClipped as any, {
                    style: {
                        fillColor: '#3b82f6',
                        fillOpacity: 0.35,
                        weight: 2,
                        color: '#3b82f6',
                        opacity: 0.6
                    },
                    pane: 'territoryPane'
                }).addTo(territoryLayer.current);
            }
        }
    }, [map, peninsula, clipTerritoryByFrontline, soldierIconNorth, soldierIconSouth]);

    // Track shown battle IDs to prevent duplicate popups
    const shownBattleIdsRef = useRef<Set<string>>(new Set());
    // Track active battle markers to prevent re-creation
    const activeBattleMarkersRef = useRef<Map<string, L.Marker>>(new Map());

    // Reset shown battles when date resets significantly (e.g. user scrubs back)
    useEffect(() => {
        if (currentDate < "1950-06-25") {
            shownBattleIdsRef.current.clear();
            activeBattleMarkersRef.current.forEach(marker => marker.remove());
            activeBattleMarkersRef.current.clear();
        }
    }, [currentDate]);

    // Draw battle markers
    const drawBattles = useCallback((battles: KoreanWarBattle[]) => {
        if (!map || !battleLayer.current) return;

        // Key set of currently visible battles
        const currentBattleKeys = new Set<string>();

        battles.forEach(battle => {
            const uniqueKey = `${battle.name}-${battle.date}`;
            currentBattleKeys.add(uniqueKey);

            // If marker doesn't exist, create it
            if (!activeBattleMarkersRef.current.has(uniqueKey)) {
                const icon = L.divIcon({
                    className: 'korean-war-battle-marker',
                    html: `
                        <div style="
                            width: 24px;
                            height: 24px;
                            background: ${battle.winner === '북한' || battle.winner === '중국' || battle.winner === '중국/북한' ? '#ef4444' : '#3b82f6'};
                            border: 3px solid white;
                            border-radius: 50%;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <span style="color: white; font-size: 12px; font-weight: bold;">⚔</span>
                        </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                const marker = L.marker(
                    [battle.coordinates[1], battle.coordinates[0]],
                    { icon, pane: 'koreanWarBattlePane' }
                );

                marker.bindPopup(`
                    <div style="min-width: 220px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${battle.name}</h3>
                        <p style="margin: 4px 0; font-size: 14px;"><strong>날짜:</strong> ${battle.date}</p>
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                            <p style="margin: 4px 0;"><strong>승리:</strong> ${battle.winner}</p>
                            <p style="margin: 4px 0;"><strong>패배:</strong> ${battle.loser}</p>
                        </div>
                        <p style="margin-top: 8px; font-size: 13px; color: #666;">${battle.description}</p>
                    </div>
                `);

                marker.addTo(battleLayer.current!);
                activeBattleMarkersRef.current.set(uniqueKey, marker);

                // Auto-open logic (only once per battle unique key)
                if (!shownBattleIdsRef.current.has(uniqueKey)) {
                    shownBattleIdsRef.current.add(uniqueKey);

                    // Open popup after short delay
                    setTimeout(() => {
                        marker.openPopup();
                    }, 100);

                    // Auto-close after 5 seconds
                    setTimeout(() => {
                        marker.closePopup();
                    }, 3000);
                }
            }
        });

        // Remove markers that remain in the Map but serve no battle in the current list
        activeBattleMarkersRef.current.forEach((marker, key) => {
            if (!currentBattleKeys.has(key)) {
                marker.remove();
                activeBattleMarkersRef.current.delete(key);
            }
        });
    }, [map]);

    // Draw movement markers (unchanged logic mostly)
    const drawMovements = useCallback((movements: KoreanWarMovement[]) => {
        if (!map || !movementLayer.current) return;
        movementLayer.current.clearLayers();

        movements.forEach(movement => {
            const coords = movement.coordinates;
            const latLngs = coords.map(c => [c[1], c[0]] as [number, number]);
            const smoothedLatLngs = interpolateCatmullRom(latLngs);
            const smoothedCoords = smoothedLatLngs.map(ll => [ll[1], ll[0]]);

            const line = turf.lineString(smoothedCoords);
            const length = turf.length(line, { units: 'kilometers' });
            const color = movement.side === 'south' ? '#3b82f6' : '#ef4444';

            L.polyline(smoothedLatLngs, {
                color: color,
                weight: 3,
                opacity: 0.6,
                dashArray: '8, 4'
            }).addTo(movementLayer.current!);

            let unitIcon;

            // Check if this is the Incheon Landing Operation movement
            if (movement.name && movement.name.includes('인천')) {
                unitIcon = L.divIcon({
                    className: '', // Container class
                    html: `<div class="landing-craft-anim" style="width:100%; height:100%; transform: rotate(0deg);"></div>`,
                    iconSize: [80, 40], // 2x size for landing craft
                    iconAnchor: [40, 20]
                });
            } else {
                const iconHtml = movement.unit_type === 'navy'
                    ? '🚢'
                    : movement.side === 'south' ? '🔵' : '🔴';

                unitIcon = L.divIcon({
                    className: 'korean-war-unit-marker',
                    html: `<div style="font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${iconHtml}</div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
            }

            const unitMarker = L.marker(smoothedLatLngs[0], { icon: unitIcon });
            unitMarker.bindTooltip(movement.name, {
                permanent: false,
                direction: 'top',
                offset: [0, -15]
            });
            unitMarker.addTo(movementLayer.current!);

            // Animation
            let startTime: number | null = null;
            const duration = 5000 / animationSpeed;
            const animate = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                const distance = easedProgress * length;

                try {
                    const point = turf.along(line, distance, { units: 'kilometers' });
                    unitMarker.setLatLng(L.latLng(point.geometry.coordinates[1], point.geometry.coordinates[0]));
                } catch (e) { }

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                }
            };
            animationRef.current = requestAnimationFrame(animate);
        });
    }, [map, animationSpeed]);

    // Main interpolation and update loop
    useEffect(() => {
        if (!isActive || !warData || !map) {
            frontlineLayer.current?.clearLayers();
            territoryLayer.current?.clearLayers();
            soldierLayer.current?.clearLayers();
            battleLayer.current?.clearLayers();
            movementLayer.current?.clearLayers();
            return;
        }

        // 1. Interpolate Frontline
        let currentCoords: number[][] = [];

        // Sort frontlines by date
        const sortedFrontlines = [...warData.frontlines].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const currentTs = new Date(currentDate).getTime();

        // Find surrounding keyframes
        let prevIndex = -1;
        for (let i = 0; i < sortedFrontlines.length; i++) {
            if (new Date(sortedFrontlines[i].date).getTime() <= currentTs) {
                prevIndex = i;
            } else {
                break;
            }
        }

        if (prevIndex === -1) {
            // Before first date
            currentCoords = sortedFrontlines[0].coordinates;
        } else if (prevIndex === sortedFrontlines.length - 1) {
            // After last date
            currentCoords = sortedFrontlines[prevIndex].coordinates;
        } else {
            // Between two dates: Interpolate
            const prev = sortedFrontlines[prevIndex];
            const next = sortedFrontlines[prevIndex + 1];

            const prevTs = new Date(prev.date).getTime();
            const nextTs = new Date(next.date).getTime();

            const t = (currentTs - prevTs) / (nextTs - prevTs);

            currentCoords = interpolateLines(prev.coordinates, next.coordinates, t);
        }

        // Filter points that are on land for Air Raids
        const validPoints: number[][] = [];
        // Assuming currentCoords are [lng, lat]
        currentCoords.forEach(c => {
            if (!peninsula || turf.booleanPointInPolygon(c, peninsula)) {
                validPoints.push(c);
            }
        });

        // Update ref for Air Raid system
        currentFrontlinePointsRef.current = validPoints;

        drawFrontline(currentCoords);

        // 2. Battles
        const battles = getBattlesForDate(warData.battles, currentDate);
        drawBattles(battles);

        // 3. Movements
        const movements = getActiveMovements(warData.movements, currentDate);
        drawMovements(movements);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isActive, warData, currentDate, map, drawFrontline, drawBattles, drawMovements, peninsula]); // Added peninsula to dependencies

    // Air Raid Loop
    useEffect(() => {
        if (!isActive || !map) return;

        const animateRaids = (timestamp: number) => {
            if (!lastRaidTimeRef.current) lastRaidTimeRef.current = timestamp;

            const now = Date.now();

            if (currentDate < "1950-07-01") {
                lastRaidTimeRef.current = timestamp; // Keep resetting so it doesn't backlog
                // Clear existing if we went back in time
                if (airRaidLayer.current) airRaidLayer.current.clearLayers();
                airRaidsRef.current = [];
                animationRef.current = requestAnimationFrame(animateRaids);
                return;
            }

            // Spawn new raid every 2-4 seconds if we have frontline points
            const timeSinceLast = timestamp - lastRaidTimeRef.current;
            if (timeSinceLast > 2000 + Math.random() * 2000) {
                const points = currentFrontlinePointsRef.current;
                if (points.length > 10) {
                    // Pick random point
                    const randIdx = Math.floor(Math.random() * points.length);
                    const centerPt = points[randIdx];

                    // Determine bearing: Generally fly South to North.
                    const bearing = (Math.random() - 0.5) * 60; // -30 to 30

                    // Determine Type
                    const isBomber = Math.random() < 0.3; // 30% Bomber
                    const type = isBomber ? 'bomber' : 'jet';

                    // Path Logic
                    // Bombers almost always Deep Raid (80%)
                    const isDeepRaid = isBomber ? (Math.random() < 0.8) : (Math.random() < 0.6);

                    const startDist = 60 + Math.random() * 40; // 60-100km South
                    const endDist = isDeepRaid
                        ? 150 + Math.random() * 100 // Deep
                        : 50 + Math.random() * 50;  // Frontline

                    const startRaw = turf.destination(centerPt, startDist, bearing + 180, { units: 'kilometers' });
                    const endRaw = turf.destination(centerPt, endDist, bearing, { units: 'kilometers' });

                    const totalDist = startDist + endDist; // Restore definition

                    // Speed Calculation
                    // Jet: Fast (Factor 3) -> Duration / 3
                    // Bomber: User requested 3x speed as well (matching jets or close to it).
                    // Originally we did "2x slower". Now user says "Bomber speed 3x".
                    // Let's make them same fast speed logic: baseDuration / 3.
                    // But maybe slightly slower than jets still? "Just make it 3x".
                    // Let's use same factor.

                    let baseDuration = (1500 + (totalDist / 100) * 1500);
                    // Apply speed factor (Higher divisor = Faster)
                    baseDuration = baseDuration / 5;

                    if (type === 'bomber') {
                        // User asked for fast bombers. We'll keep them fast.
                        // Optional: slightly slower multiplier if desired, but user said "3x".
                        // We will leave it as is (same as jet).
                        // Or maybe 1.2x of jet duration to give sense of weight but still FAST.
                        baseDuration = baseDuration * 1.4;
                    }


                    const newRaid: AirRaid = {
                        id: now,
                        type: type,
                        startPos: startRaw.geometry.coordinates,
                        endPos: endRaw.geometry.coordinates,
                        startTime: now,
                        duration: baseDuration,
                        rotation: bearing
                    };

                    airRaidsRef.current.push(newRaid);
                    lastRaidTimeRef.current = timestamp;
                }
            }


            // --- Battleship Logic ---
            // Spawn battleship at Incheon if date >= 1950-09-15
            // Fixed position: 126.35, 37.45 (Further West into sea)

            const INCHEON_POS = [126.35, 37.45];
            const BATTLESHIP_START_DATE = "1950-09-15";
            const BATTLESHIP_END_DATE = "1950-10-05"; // Extended to cover post-Seoul reclamation support

            // Check if we should have a battleship
            const shouldHaveBattleship = currentDate >= BATTLESHIP_START_DATE && currentDate <= BATTLESHIP_END_DATE;

            if (shouldHaveBattleship && !battleshipRef.current) {
                // Create Battleship
                const battleship: AirRaid = {
                    id: 99999, // Special ID
                    type: 'battleship',
                    startPos: INCHEON_POS,
                    endPos: INCHEON_POS,
                    startTime: now,
                    duration: 999999999, // Infinite
                    rotation: 0
                };
                battleshipRef.current = battleship;
                airRaidsRef.current.push(battleship);
            } else if (!shouldHaveBattleship && battleshipRef.current) {
                // Remove Battleship if out of date range
                // We need to remove it from airRaidsRef and also remove its marker
                if (battleshipRef.current.marker) {
                    battleshipRef.current.marker.remove();
                }
                airRaidsRef.current = airRaidsRef.current.filter(r => r.id !== 99999);
                battleshipRef.current = null;
            }


            // Render and Update Raids

            // Do NOT clear layers every frame. Use persistent markers.

            const activeRaids: AirRaid[] = [];

            airRaidsRef.current.forEach(raid => {
                const elapsed = now - raid.startTime;
                const progress = elapsed / raid.duration;

                if (progress < 1.0) {
                    try {
                        // Interpolate position
                        let lng, lat;
                        if (raid.type === 'dogfight' || raid.type === 'battleship') {
                            lng = raid.startPos[0];
                            lat = raid.startPos[1];
                        } else {
                            lng = raid.startPos[0] + (raid.endPos[0] - raid.startPos[0]) * progress;
                            lat = raid.startPos[1] + (raid.endPos[1] - raid.startPos[1]) * progress;
                        }

                        // Fade out
                        let opacity = 1.0;
                        if (raid.type !== 'dogfight' && raid.type !== 'battleship' && progress > 0.8) {
                            opacity = (1 - progress) / 0.2;
                        }

                        // Create Marker if not exists
                        if (!raid.marker && airRaidLayer.current) {
                            // Initial class - Start static
                            let className = 'usaf-jet-static';
                            let size = JET_SIZE;

                            if (raid.type === 'bomber') {
                                className = 'usaf-bomber-static';
                                size = BOMBER_SIZE;
                            } else if (raid.type === 'dogfight') {
                                className = 'dogfight-icon';
                                size = DOGFIGHT_SIZE;
                            } else if (raid.type === 'battleship') {
                                className = 'battleship-icon';
                                size = BATTLESHIP_SIZE;
                            }

                            // Calculate bearing directly from path vector for value precision
                            const vectorBearing = turf.bearing(turf.point(raid.startPos), turf.point(raid.endPos));
                            // 폭격기는 이미지가 오른쪽을 향하므로 -90도 오프셋, 나머지는 0
                            const rotationOffset = raid.type === 'bomber' ? -90 : 0;

                            const icon = L.divIcon({
                                className: 'korean-war-air-raid-marker', // Generic class for container
                                // Apply specific class to inner div so it rotates with the transform
                                html: `<div class="${className}" style="width:100%; height:100%; transform: rotate(${vectorBearing + rotationOffset}deg);"></div>`,
                                iconSize: size as L.PointTuple,
                                iconAnchor: [size[0] / 2, size[1] / 2] as L.PointTuple
                            });

                            raid.marker = L.marker([lat, lng], {
                                icon: icon,
                                zIndexOffset: raid.type === 'dogfight' ? 2000 : (raid.type === 'battleship' ? 900 : 1000)
                            }).addTo(airRaidLayer.current);
                        }


                        // Update Marker Position & Animation State
                        if (raid.marker) {
                            raid.marker.setLatLng([lat, lng]);
                            raid.marker.setOpacity(opacity);

                            // Handle Animation State (Static -> Flying -> Static)
                            if (raid.type === 'jet' || raid.type === 'bomber') {
                                const wrapper = raid.marker.getElement();
                                const el = wrapper?.firstElementChild as HTMLElement;

                                if (el) {
                                    const isFlying = progress > 0.1 && progress < 0.9;
                                    const baseClass = raid.type === 'jet' ? 'usaf-jet' : 'usaf-bomber';
                                    const staticClass = `${baseClass}-static`;
                                    const flyingClass = `${baseClass}-flying`;

                                    if (isFlying) {
                                        if (!el.classList.contains(flyingClass)) {
                                            el.classList.remove(staticClass);
                                            el.classList.add(flyingClass);
                                        }
                                    } else {
                                        if (!el.classList.contains(staticClass)) {
                                            el.classList.remove(flyingClass);
                                            el.classList.add(staticClass);
                                        }
                                    }
                                }
                            }
                        }

                        activeRaids.push(raid);
                    } catch (e) { }
                } else {
                    // Check if it's infinite duration (battleship)
                    if (raid.type === 'battleship') {
                        // Do nothing, keep it alive
                        activeRaids.push(raid);
                    } else {
                        // Remove marker when done
                        if (raid.marker) {
                            raid.marker.remove();
                        }

                        // Chance for Dogfight at end of raid (if not already dogfight)
                        if (raid.type !== 'dogfight' && Math.random() < 0.2) {
                            const dogfightRaid: AirRaid = {
                                id: now + Math.random(),
                                type: 'dogfight',
                                startPos: raid.endPos, // Spawn at end position
                                endPos: raid.endPos,
                                startTime: now,
                                duration: 2000, // 2 seconds duration
                                rotation: 0 // No rotation
                            };
                            activeRaids.push(dogfightRaid);
                        }
                    }
                }

            });

            airRaidsRef.current = activeRaids;


            animationRef.current = requestAnimationFrame(animateRaids);
        };

        // Start loop
        const raidLoopId = requestAnimationFrame(animateRaids);
        return () => cancelAnimationFrame(raidLoopId);
    }, [isActive, map, currentDate]); // Added currentDate dependency for date check


    // We need to inject the spawning logic properly.
    // Let's refactor:
    // 1. Add `currentFrontlinePointsRef`.
    // 2. Update `drawFrontline` to set `currentFrontlinePointsRef.current = validPoints`.
    // 3. Implement the loop fully.

    return {
        warData,
        frontlineLayer: frontlineLayer.current,
        territoryLayer: territoryLayer.current,
        battleLayer: battleLayer.current,
        movementLayer: movementLayer.current,
        airRaidLayer: airRaidLayer.current
    };
};

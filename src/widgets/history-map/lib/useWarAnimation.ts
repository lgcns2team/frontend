import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { type WarData } from '../../../shared/api/war-api';
import { interpolateCatmullRom } from './math-utils';
import { getEraForYear } from '../../../shared/config/era-theme';

interface UseWarAnimationProps {
    map: L.Map | null;
    warData: WarData[];
    speed?: number;
    isActive: boolean;
    currentYear: number;
    historicalLayer: L.Layer | null;
}

export const useWarAnimation = ({
    map,
    warData,
    speed = 1,
    isActive,
    currentYear,
    historicalLayer
}: UseWarAnimationProps) => {
    const animationLayer = useRef<L.LayerGroup | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const startTime = useRef<number | null>(null);

    useEffect(() => {
        if (!map) return;

        // Initialize layer
        if (!animationLayer.current) {
            animationLayer.current = L.layerGroup().addTo(map);
            // Ensure it's on top of lines but below popups
            if (map.getPane('warPane')) {
                // If warPane exists (created in useWarLayer), use it?
                // Or create a separate animation pane?
                // Let's use the default marker pane for now, or warPane if we want z-index control.
                // But markers usually sit on markerPane (600). warPane is 500.
                // So units will be above lines naturally if on markerPane.
            }
        }

        return () => {
            if (animationLayer.current) {
                animationLayer.current.clearLayers();
                animationLayer.current.remove();
                animationLayer.current = null;
            }
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [map]);

    useEffect(() => {
        console.log('[useWarAnimation] Effect triggered:', { isActive, hasMap: !!map, hasLayer: !!animationLayer.current, warDataCount: warData.length });

        if (!isActive || !map || !animationLayer.current || warData.length === 0) {
            if (animationLayer.current) {
                animationLayer.current.clearLayers();
            }
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            return;
        }

        // Icons - soldier1 for land, warship for sea (defined inside useEffect to update with currentYear)
        const era = getEraForYear(currentYear);

        const soldierIcon = L.icon({
            iconUrl: `/assets/images/${era.id}/soldier1.png`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            className: 'war-unit-icon'
        });

        const warshipIcon = L.icon({
            iconUrl: `/assets/images/${era.id}/warship.png`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            className: 'war-unit-icon'
        });

        // Blue route icons (ksoldier / kwarship)
        const ksoldierIcon = L.icon({
            iconUrl: `/assets/images/${era.id}/ksoldier.png`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            className: 'war-unit-icon'
        });

        const kwarshipIcon = L.icon({
            iconUrl: `/assets/images/${era.id}/kwarship.png`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            className: 'war-unit-icon'
        });

        // Purple route icon (always soldier3, regardless of terrain)
        const soldier3Icon = L.icon({
            iconUrl: `/assets/images/${era.id}/soldier3.png`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            className: 'war-unit-icon'
        });

        // Turtle ship icon for specific Korean naval battles
        const tshipIcon = L.icon({
            iconUrl: `/assets/images/${era.id}/Tship.png`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            className: 'war-unit-icon'
        });

        const activeUnits: {
            marker: L.Marker;
            line: any; // Turf LineString
            length: number;
            duration: number; // Duration in ms
            startDelay: number; // Delay before this unit starts (synced with route drawing)
            isVisible: boolean; // Whether the unit is currently visible
            routeColor: string; // Route color
            battleName: string; // Battle name
            battleDate: string | null; // Battle date
            winnerGeneral: string | null; // Winner force/general name
            loserGeneral: string | null; // Loser force/general name
            tooltipShown: boolean; // Whether tooltip has been shown for this cycle
        }[] = [];

        // Total cycle time: all routes + 10 second pause
        // Total cycle time: all routes + 10 second pause
        const ROUTE_STAGGER_DELAY = 1500; // Same as useWarLayer
        // const UNIT_TRAVEL_DURATION = 3500; // Same as route drawing animation (3.5s)

        // 고정 속도 설정 (km/ms) - 값을 조절하여 속도 변경 가능
        // 예: 0.1 = 10ms당 1km 이동 (빠름), 0.05 = 20ms당 1km (느림)
        // 적절한 값: 약 300km를 3초에 간다고 가정하면 100km/s = 0.1km/ms
        const ANIMATION_SPEED = 0.15;

        const PAUSE_BEFORE_REPLAY = 10000; // 10 seconds pause

        // Process each battle route - sort by date first (same logic as useWarLayer)
        warData.forEach(war => {
            // Sort battles by date: valid dates first (chronological), null/invalid dates last
            const sortedBattles = [...war.battles].sort((a, b) => {
                const dateA = a.battleDate ? new Date(a.battleDate).getTime() : null;
                const dateB = b.battleDate ? new Date(b.battleDate).getTime() : null;

                const isValidA = dateA !== null && !isNaN(dateA);
                const isValidB = dateB !== null && !isNaN(dateB);

                if (!isValidA && !isValidB) return 0;
                if (!isValidA) return 1;
                if (!isValidB) return -1;

                return dateA - dateB;
            });

            sortedBattles.forEach((battle, battleIndex) => {
                if (battle.markerRoute && battle.markerRoute.coordinates.length > 0) {
                    const coords = battle.markerRoute.coordinates;
                    // GeoJSON is [lng, lat], Leaflet needs [lat, lng]
                    let latLngs = coords.map(coord => [coord[1], coord[0]] as [number, number]);

                    // If the last point is the same as the first point, remove it
                    if (latLngs.length > 1) {
                        const first = latLngs[0];
                        const last = latLngs[latLngs.length - 1];
                        if (first[0] === last[0] && first[1] === last[1]) {
                            latLngs = latLngs.slice(0, -1);
                        }
                    }

                    // Smooth the path using Catmull-Rom Spline
                    // We need to use the SAME smoothing as the visual line for alignment
                    const smoothedLatLngs = interpolateCatmullRom(latLngs);

                    // Convert back to [lng, lat] for Turf
                    const smoothedCoords = smoothedLatLngs.map(ll => [ll[1], ll[0]]);
                    const line = turf.lineString(smoothedCoords);
                    const length = turf.length(line, { units: 'kilometers' });

                    // Calculate constant speed duration
                    // duration = distance / speed
                    const calculatedDuration = length / ANIMATION_SPEED;
                    // 너무 짧으면 최소 1초, 너무 길면 최대 10초 등으로 제한할 수도 있지만 일단 원시값 사용

                    // Calculate start delay synced with route drawing
                    const startDelay = battleIndex * ROUTE_STAGGER_DELAY;

                    // Get the starting position for the marker (first point of the route)
                    const startCoord = smoothedCoords[0];
                    const startLatLng: [number, number] = [startCoord[1], startCoord[0]];

                    // Create marker at starting position, initially invisible
                    const marker = L.marker(startLatLng, {
                        icon: soldierIcon, // Using soldierIcon instead of removed kimaIcon
                        interactive: false,
                        opacity: 0 // Start invisible, will fade in when animation starts
                    }).addTo(animationLayer.current!);

                    console.log('[useWarAnimation] Created marker for battle:', battle.battleName, 'startDelay:', startDelay, 'length:', length, 'duration:', calculatedDuration);

                    activeUnits.push({
                        marker,
                        line,
                        length,
                        duration: calculatedDuration, // UNIT_TRAVEL_DURATION 대신 계산된 시간 사용
                        startDelay,
                        isVisible: false,
                        routeColor: battle.routeColor || '#ef4444',
                        battleName: battle.battleName,
                        battleDate: battle.battleDate || null,
                        winnerGeneral: battle.winnerGeneral || null,
                        loserGeneral: battle.loserGeneral || null,
                        tooltipShown: false
                    });
                }
            });
        });

        // Calculate total cycle duration
        // Find the unit that finishes last
        let maxEndTime = 0;
        activeUnits.forEach(unit => {
            const endTime = unit.startDelay + unit.duration;
            if (endTime > maxEndTime) maxEndTime = endTime;
        });

        const TOTAL_CYCLE_DURATION = maxEndTime + PAUSE_BEFORE_REPLAY;
        // const lastUnitDelay = activeUnits.length > 0 ? activeUnits[activeUnits.length - 1].startDelay : 0;
        // const TOTAL_CYCLE_DURATION = lastUnitDelay + UNIT_TRAVEL_DURATION + PAUSE_BEFORE_REPLAY;

        const animate = (timestamp: number) => {
            if (!startTime.current) {
                startTime.current = timestamp;
                console.log('[useWarAnimation] Animation cycle started at:', timestamp);
            }

            // Time elapsed since animation cycle started
            const cycleTime = timestamp - startTime.current;

            // Check if we need to restart the cycle (after pause)
            if (cycleTime > TOTAL_CYCLE_DURATION) {
                // Reset for new cycle
                startTime.current = timestamp;
                // Hide all markers for fresh start
                activeUnits.forEach(unit => {
                    unit.isVisible = false;
                    unit.tooltipShown = false;
                    unit.marker.setOpacity(0);
                });
                console.log('[useWarAnimation] Restarting animation cycle after 10s pause');
            }

            activeUnits.forEach(unit => {
                // Calculate time since this unit should have started
                const unitTime = cycleTime - unit.startDelay;

                if (unitTime < 0) {
                    // Not yet time for this unit to start
                    if (unit.isVisible) {
                        unit.marker.setOpacity(0);
                        unit.isVisible = false;
                    }
                    return;
                }

                if (unitTime > unit.duration) {
                    // Unit has finished its journey, hide it
                    if (unit.isVisible) {
                        unit.marker.setOpacity(0);
                        unit.isVisible = false;
                    }
                    return;
                }

                // Unit is active - show it and update position
                if (!unit.isVisible) {
                    unit.marker.setOpacity(1);
                    unit.isVisible = true;

                    // Show battle info tooltip when marker becomes visible
                    if (!unit.tooltipShown) {
                        unit.tooltipShown = true;

                        // Use Leaflet's built-in tooltip for reliable display
                        const tooltipContent = `
                            <div style="
                                background: rgba(255, 255, 255, 0.5);
                                backdrop-filter: blur(8px);
                                border: 1px solid rgba(255, 255, 255, 0.2);
                                border-radius: 8px;
                                padding: 10px 14px;
                                color: #fff;
                                font-size: 13px;
                                white-space: nowrap;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                            ">
                                <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #333333;">${unit.battleName}</div>
                                ${(unit.winnerGeneral || unit.loserGeneral) ? `<div style="font-weight: 600; font-size: 13px; margin-bottom: 6px; color: #666666;">${unit.winnerGeneral || ''}${unit.winnerGeneral && unit.loserGeneral ? ' vs ' : ''}${unit.loserGeneral || ''}</div>` : ''}
                                ${unit.battleDate ? `<div style="font-size: 12px; color: rgba(102, 102, 102, 0.8);">${unit.battleDate}</div>` : ''}
                            </div>
                        `;

                        unit.marker.bindTooltip(tooltipContent, {
                            permanent: true,
                            direction: 'right',
                            offset: [20, 0],
                            className: 'battle-tooltip-container',
                            opacity: 1
                        }).openTooltip();

                        console.log('[useWarAnimation] Tooltip opened for:', unit.battleName);

                        // Remove tooltip after 3 seconds
                        setTimeout(() => {
                            if (unit.marker) {
                                unit.marker.unbindTooltip();
                                console.log('[useWarAnimation] Tooltip closed for:', unit.battleName);
                            }
                        }, 1500);
                    }
                }

                // Calculate progress (0 to 1) for this unit
                const progress = unitTime / unit.duration;

                // Get position along the line
                const distance = progress * unit.length;
                const point = turf.along(unit.line, distance, { units: 'kilometers' });
                const coords = point.geometry.coordinates;
                const latLng = L.latLng(coords[1], coords[0]);

                // Update marker position
                unit.marker.setLatLng(latLng);

                // Start of icon switching logic
                let targetIcon;

                // Check for specific naval battles that use Tship
                const turtleShipBattles = ['한산도 대첩', '노량 해전', '명량 해전'];
                if (turtleShipBattles.includes(unit.battleName)) {
                    targetIcon = tshipIcon;
                } else if (unit.routeColor === '#9333ea') {
                    // Purple route: always use soldier3, regardless of terrain
                    targetIcon = soldier3Icon;
                } else if (historicalLayer) {
                    // For red and blue routes, check if on land or sea
                    let isOnLand = false;

                    (historicalLayer as any).eachLayer((layer: any) => {
                        if (isOnLand) return; // Already found

                        if (layer.feature && (layer.feature.geometry.type === 'Polygon' || layer.feature.geometry.type === 'MultiPolygon')) {
                            const pt = turf.point([coords[0], coords[1]]);
                            if (turf.booleanPointInPolygon(pt, layer.feature)) {
                                isOnLand = true;
                            }
                        }
                    });

                    // Update icon based on route color and location
                    const isBlueRoute = unit.routeColor === '#3b82f6';
                    if (isBlueRoute) {
                        // Blue route: ksoldier (land) / kwarship (sea)
                        targetIcon = isOnLand ? ksoldierIcon : kwarshipIcon;
                    } else {
                        // Red route: soldier1 (land) / warship (sea)
                        targetIcon = isOnLand ? soldierIcon : warshipIcon;
                    }
                }

                if (targetIcon && unit.marker.getIcon() !== targetIcon) {
                    unit.marker.setIcon(targetIcon);
                }

                // Calculate rotation (bearing) for direction
                const nextDist = distance + (unit.length * 0.01);
                const nextPoint = turf.along(unit.line, nextDist > unit.length ? unit.length : nextDist, { units: 'kilometers' });
                const bearing = turf.bearing(point, nextPoint);

                // Flip icon if moving West
                const element = unit.marker.getElement();
                if (element) {
                    if (bearing < -10 && bearing > -170) {
                        element.style.transform += ' scaleX(-1)';
                    }
                }
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };

        startTime.current = null;
        animationFrameId.current = requestAnimationFrame(animate);
        console.log('[useWarAnimation] Animation loop started with', activeUnits.length, 'units');

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (animationLayer.current) {
                animationLayer.current.clearLayers();
            }
        };
    }, [warData, map, isActive, currentYear, historicalLayer]);
};

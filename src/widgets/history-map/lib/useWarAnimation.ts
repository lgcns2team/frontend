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
}

export const useWarAnimation = ({
    map,
    warData,
    speed = 1,
    isActive,
    currentYear
}: UseWarAnimationProps) => {
    const animationLayer = useRef<L.LayerGroup | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const startTime = useRef<number | null>(null);

    // Icon
    const era = getEraForYear(currentYear);
    const kimaIcon = L.icon({
        iconUrl: `/assets/images/${era.id}/soldier1.png`,
        iconSize: [40, 40],
        iconAnchor: [40, 40],
        className: 'war-unit-icon'
    });

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

        const activeUnits: {
            marker: L.Marker;
            line: any; // Turf LineString
            length: number;
            duration: number; // Duration in ms
            startDelay: number; // Delay before this unit starts (synced with route drawing)
            isVisible: boolean; // Whether the unit is currently visible
        }[] = [];

        // Total cycle time: all routes + 10 second pause
        const ROUTE_STAGGER_DELAY = 1500; // Same as useWarLayer
        const UNIT_TRAVEL_DURATION = 3500; // Same as route drawing animation (3.5s)
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

                    // Calculate start delay synced with route drawing
                    const startDelay = battleIndex * ROUTE_STAGGER_DELAY;

                    // Get the starting position for the marker (first point of the route)
                    const startCoord = smoothedCoords[0];
                    const startLatLng: [number, number] = [startCoord[1], startCoord[0]];

                    // Create marker at starting position, initially invisible
                    const marker = L.marker(startLatLng, {
                        icon: kimaIcon,
                        interactive: false,
                        opacity: 0 // Start invisible, will fade in when animation starts
                    }).addTo(animationLayer.current!);

                    console.log('[useWarAnimation] Created marker for battle:', battle.battleName, 'startDelay:', startDelay);

                    activeUnits.push({
                        marker,
                        line,
                        length,
                        duration: UNIT_TRAVEL_DURATION,
                        startDelay,
                        isVisible: false
                    });
                }
            });
        });

        // Calculate total cycle duration
        const lastUnitDelay = activeUnits.length > 0 ? activeUnits[activeUnits.length - 1].startDelay : 0;
        const TOTAL_CYCLE_DURATION = lastUnitDelay + UNIT_TRAVEL_DURATION + PAUSE_BEFORE_REPLAY;

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
    }, [warData, map, isActive, currentYear]);
};

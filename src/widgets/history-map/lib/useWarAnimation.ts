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
            offset: number; // Random start offset
            routeColor: string; // Route color to determine if naval battle
            battleName: string; // Battle name to determine specific icons
        }[] = [];

        // Process each battle route
        warData.forEach(war => {
            war.battles.forEach(battle => {
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

                    // Duration: e.g., 5 seconds for full path
                    const duration = 5000;

                    // Get route color from battle data
                    const routeColor = battle.routeColor || '#ef4444'; // Default to red

                    const marker = L.marker([0, 0], {
                        icon: soldierIcon,
                        interactive: false // Let clicks pass through to the line
                    }).addTo(animationLayer.current!);

                    console.log('[useWarAnimation] Created marker for battle:', battle.battleName, 'routeColor:', routeColor);

                    activeUnits.push({
                        marker,
                        line,
                        length,
                        duration,
                        offset: Math.random() * duration,
                        routeColor,
                        battleName: battle.battleName
                    });
                }
            });
        });

        const animate = (timestamp: number) => {
            if (!startTime.current) {
                startTime.current = timestamp;
                console.log('[useWarAnimation] Animation started at:', timestamp);
            }

            const globalTime = timestamp;

            activeUnits.forEach(unit => {
                // Calculate progress (0 to 1) based on time and duration, looping
                const progress = ((globalTime + unit.offset) % unit.duration) / unit.duration;

                // Get position along the line
                const distance = progress * unit.length;
                const point = turf.along(unit.line, distance, { units: 'kilometers' });
                const coords = point.geometry.coordinates;
                const latLng = L.latLng(coords[1], coords[0]);

                // Update marker position
                unit.marker.setLatLng(latLng);

                // Check route color to determine which icon set to use
                // #ef4444 = red route, #3b82f6 = blue route, #9333ea = purple route
                let targetIcon;

                // Check for specific naval battles that use Tship
                const turtleShipBattles = ['한산도 대첩', '노량 해전', '명량 해전'];
                if (turtleShipBattles.includes(unit.battleName)) {
                    // Specific Korean naval battles: always use Tship
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

import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { type WarData } from '../../../shared/api/war-api';
import { interpolateCatmullRom } from './math-utils';

interface UseWarAnimationProps {
    map: L.Map | null;
    warData: WarData[];
    speed?: number;
    isActive: boolean;
}

export const useWarAnimation = ({
    map,
    warData,
    speed = 1,
    isActive
}: UseWarAnimationProps) => {
    const animationLayer = useRef<L.LayerGroup | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const startTime = useRef<number | null>(null);

    // Icon
    const kimaIcon = L.icon({
        iconUrl: '/assets/images/warunit/mong/mong-kima-bow.png',
        iconSize: [30, 30],
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
            offset: number; // Random start offset
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

                    const marker = L.marker([0, 0], {
                        icon: kimaIcon,
                        interactive: false // Let clicks pass through to the line
                    }).addTo(animationLayer.current!);

                    console.log('[useWarAnimation] Created marker for battle:', battle.battleName);

                    activeUnits.push({
                        marker,
                        line,
                        length,
                        duration,
                        offset: Math.random() * duration
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

                // Calculate rotation (bearing)
                // Get a point slightly ahead to determine direction
                const nextDist = distance + (unit.length * 0.01); // Look ahead 1%
                const nextPoint = turf.along(unit.line, nextDist > unit.length ? nextDist - unit.length : nextDist, { units: 'kilometers' });
                const bearing = turf.bearing(point, nextPoint);

                // Rotate icon
                // Icon points Right by default? Or Up?
                // If icon points Right: Rotation = Bearing - 90?
                // Let's assume standard icon points Up.
                // Turf bearing is -180 to 180, 0 is North.
                // CSS rotate is clockwise.
                // If bearing is 90 (East), we want 90 deg rotation.
                // If bearing is 0 (North), we want 0 deg rotation.
                // So simply `bearing` should work if icon points Up.
                // If icon points Left (like the horse usually does), we need adjustment.
                // The user said "mong-kima-bow.png". Usually these side-view images face Left or Right.
                // If it faces Left: To face North (0), it needs +90 deg.
                // Let's try just `bearing` first, or maybe flip it based on direction?

                // For side-view units (like horses), we usually just flip X if moving left/right.
                // But if we want it to follow the path rotation:
                const rotation = bearing;

                // Apply rotation to the icon's internal div
                const icon = unit.marker.getIcon() as L.Icon;
                // Leaflet icons don't support rotation natively easily without plugins or CSS transforms on the img.
                // We can use DivIcon with rotation, but we used L.icon.
                // Let's switch to DivIcon for rotation support if needed, 
                // OR just flip it horizontally if moving West.

                // Simple approach: Flip if moving West
                if (bearing < 0 && bearing > -180) {
                    // Moving West-ish
                    // unit.marker.getElement()?.classList.add('flip-x');
                } else {
                    // unit.marker.getElement()?.classList.remove('flip-x');
                }

                // For now, let's just move it. The user asked for "move from start to end".
                // Rotation might be overkill if it's a 2D sprite.
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
    }, [warData, map, isActive]);
};

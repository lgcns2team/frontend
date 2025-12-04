import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import type { TradeRouteWithColor } from './trade-route';

interface UseTradeAnimationProps {
    map: L.Map | null;
    routes: TradeRouteWithColor[];
    historicalLayer: L.Layer | null;
    isActive: boolean;
    speed?: number;
}

export const useTradeAnimation = ({
    map,
    routes,
    historicalLayer,
    isActive
}: UseTradeAnimationProps) => {
    const animationLayer = useRef<L.LayerGroup | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const startTime = useRef<number | null>(null);

    // Icons
    const horseIcon = L.icon({
        iconUrl: '/assets/images/tradeunit/acient-horse.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        className: 'trade-unit-icon'
    });

    const shipIcon = L.icon({
        iconUrl: '/assets/images/tradeunit/ship-acient.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        className: 'trade-unit-icon'
    });

    useEffect(() => {
        if (!map) return;

        // Initialize layer
        if (!animationLayer.current) {
            animationLayer.current = L.layerGroup().addTo(map);
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
        if (!isActive || !map || !animationLayer.current || routes.length === 0) {
            if (animationLayer.current) {
                animationLayer.current.clearLayers();
            }
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            return;
        }

        // Prepare routes data
        const activeUnits: {
            marker: L.Marker;
            line: any; // Turf LineString
            length: number;
            duration: number; // Duration in ms
            offset: number; // Random start offset
        }[] = [];

        // Create a unit for each route
        routes.forEach(({ route }) => {
            const geometry = route.path;
            if (geometry && geometry.type === 'LineString') {
                const feature: GeoJSON.Feature<GeoJSON.LineString> = {
                    type: 'Feature',
                    properties: {},
                    geometry: geometry
                };
                const line = feature as any; // Turf feature
                const length = turf.length(line, { units: 'kilometers' });

                // Base duration on length (e.g., 1000km = 5 seconds)
                // Base duration on length (e.g., 1000km = 10 seconds)
                const duration = (length / 100) * 1000;

                const marker = L.marker([0, 0], { icon: horseIcon }).addTo(animationLayer.current!);

                activeUnits.push({
                    marker,
                    line,
                    length,
                    duration,
                    offset: Math.random() * duration // Randomize start positions
                });
            }
        });

        const animate = (timestamp: number) => {
            if (!startTime.current) startTime.current = timestamp;

            // Global time scaling could be applied here if needed
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

                // Check if on land or sea
                let isOnLand = false;

                if (historicalLayer) {
                    // We need to iterate over the Leaflet layers in the historicalLayer group
                    // and convert them to Turf polygons to check containment.
                    // Optimization: This can be expensive. 
                    // Better approach: Convert historicalLayer to a single Turf FeatureCollection once when it changes.
                    // For now, we'll do a simple iteration.

                    (historicalLayer as any).eachLayer((layer: any) => {
                        if (isOnLand) return; // Already found

                        if (layer.feature && (layer.feature.geometry.type === 'Polygon' || layer.feature.geometry.type === 'MultiPolygon')) {
                            const pt = turf.point([coords[0], coords[1]]);
                            if (turf.booleanPointInPolygon(pt, layer.feature)) {
                                isOnLand = true;
                            }
                        }
                    });
                }

                // Update icon
                const targetIcon = isOnLand ? horseIcon : shipIcon;
                if (unit.marker.getIcon() !== targetIcon) {
                    unit.marker.setIcon(targetIcon);
                }
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };

        startTime.current = null;
        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (animationLayer.current) {
                animationLayer.current.clearLayers();
            }
        };
    }, [isActive, routes, historicalLayer, map]); // Re-run if these change
};

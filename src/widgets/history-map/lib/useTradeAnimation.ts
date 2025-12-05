import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import type { TradeRouteWithColor } from './trade-route';
import { getEraForYear } from '../../../shared/config/era-theme';

interface UseTradeAnimationProps {
    map: L.Map | null;
    routes: TradeRouteWithColor[];
    historicalLayer: L.Layer | null;
    isActive: boolean;
    speed?: number;
    currentYear: number;
}

export const useTradeAnimation = ({
    map,
    routes,
    historicalLayer,
    isActive,
    currentYear
}: UseTradeAnimationProps) => {
    const animationLayer = useRef<L.LayerGroup | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const startTime = useRef<number | null>(null);

    // Icons
    // Icons are now dynamic based on era
    const era = getEraForYear(currentYear);

    const horseIcon = L.icon({
        iconUrl: `/assets/images/${era.id}/transport.png`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        className: 'trade-unit-icon'
    });

    const shipIcon = L.icon({
        iconUrl: `/assets/images/${era.id}/ship.png`,
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
        console.log('[useTradeAnimation] Effect triggered:', { isActive, hasMap: !!map, hasLayer: !!animationLayer.current, routesCount: routes.length });

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
            currentProgress: number; // 0 to 1
            isPaused: boolean;
        }[] = [];

        // Clear existing markers before adding new ones to prevent duplication
        if (animationLayer.current) {
            animationLayer.current.clearLayers();
        }

        // Create a unit for each route
        routes.forEach(({ route, trade }) => {
            const geometry = route.path;
            if (geometry && geometry.type === 'LineString') {
                const feature: GeoJSON.Feature<GeoJSON.LineString> = {
                    type: 'Feature',
                    properties: {},
                    geometry: geometry
                };
                const line = feature as any; // Turf feature
                const length = turf.length(line, { units: 'kilometers' });

                // Base duration on length (e.g., 1000km = 20 seconds) - Slower speed
                const duration = (length / 50) * 1000;

                const marker = L.marker([0, 0], { icon: horseIcon }).addTo(animationLayer.current!);

                // Bind popup with trade info
                const popupContent = `
                    <div style="text-align: center; font-size: 14px;">
                        <h4 style="margin: 0 0 5px 0; color: #333;">무역 정보</h4>
                        <div style="margin-bottom: 5px;">
                            <strong>${trade.startCountry.countryName}</strong> → <strong>${trade.endCountry.countryName}</strong>
                        </div>
                        <div style="color: #666;">
                            품목: <strong>${trade.product}</strong>
                        </div>
                        <div style="font-size: 12px; color: #999; margin-top: 3px;">
                            ${trade.tradeYear}년
                        </div>
                    </div>
                `;
                marker.bindPopup(popupContent, { closeButton: false });

                const unit = {
                    marker,
                    line,
                    length,
                    duration,
                    currentProgress: Math.random(), // Random start position
                    isPaused: false
                };

                // Event listeners for pause/resume
                marker.on('popupopen', () => {
                    unit.isPaused = true;
                });
                marker.on('popupclose', () => {
                    unit.isPaused = false;
                });

                activeUnits.push(unit);
            }
        });

        const animate = (timestamp: number) => {
            if (!startTime.current) {
                startTime.current = timestamp;
            }

            // Calculate delta time
            const deltaTime = timestamp - (startTime.current || timestamp);
            startTime.current = timestamp; // Update for next frame

            activeUnits.forEach(unit => {
                if (unit.isPaused) return;

                // Update progress based on delta time
                unit.currentProgress += deltaTime / unit.duration;

                // Loop progress
                if (unit.currentProgress > 1) {
                    unit.currentProgress -= 1;
                }

                // Get position along the line
                const distance = unit.currentProgress * unit.length;
                const point = turf.along(unit.line, distance, { units: 'kilometers' });
                const coords = point.geometry.coordinates;
                const latLng = L.latLng(coords[1], coords[0]);

                // Update marker position
                unit.marker.setLatLng(latLng);

                // Check if on land or sea
                let isOnLand = false;

                if (historicalLayer) {
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

        startTime.current = null; // Reset start time for delta calculation
        animationFrameId.current = requestAnimationFrame(animate);
        console.log('[useTradeAnimation] Animation loop started with', activeUnits.length, 'units');

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (animationLayer.current) {
                animationLayer.current.clearLayers();
            }
        };
    }, [isActive, routes, historicalLayer, map, currentYear]); // Re-run if these change
};

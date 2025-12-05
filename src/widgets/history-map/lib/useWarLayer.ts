import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import { fetchWarData, type WarData } from '../../../shared/api/war-api';
import { interpolateCatmullRom } from './math-utils';
import { useWarAnimation } from './useWarAnimation';

export const useWarLayer = (map: L.Map | null, currentYear: number, isVisible: boolean) => {
    const warLayer = useRef<L.LayerGroup | null>(null);
    const [warData, setWarData] = useState<WarData[]>([]);

    // Initialize layer and pane
    useEffect(() => {
        if (!map) return;

        // Create a custom pane for war layer to ensure it's on top
        // Default overlayPane z-index is 400. We want it higher than countries but lower than popups (600+).
        if (!map.getPane('warPane')) {
            map.createPane('warPane');
            map.getPane('warPane')!.style.zIndex = '500';
        }

        warLayer.current = L.layerGroup().addTo(map);

        return () => {
            if (warLayer.current) {
                warLayer.current.remove();
                warLayer.current = null;
            }
        };
    }, [map]);

    // Fetch data when year changes
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await fetchWarData(currentYear);
                setWarData(data);
            } catch (error) {
                console.error('Failed to fetch war data:', error);
                setWarData([]);
            }
        };

        const timer = setTimeout(() => {
            fetchData();
        }, 100);

        return () => clearTimeout(timer);
    }, [currentYear]);

    // Draw static layer when warData changes or visibility changes
    useEffect(() => {
        if (!map || !warLayer.current) return;

        warLayer.current.clearLayers();

        if (!isVisible) return;

        warData.forEach(war => {
            war.battles.forEach(battle => {
                if (battle.markerRoute && battle.markerRoute.coordinates && battle.markerRoute.coordinates.length > 0) {
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
                    const smoothedLatLngs = interpolateCatmullRom(latLngs);

                    // Get route color from battle data, default to red
                    const routeColor = battle.routeColor || '#ef4444';
                    const routeColorHover = battle.routeColor
                        ? (battle.routeColor === '#3b82f6' ? '#2563eb' : '#dc2626')
                        : '#dc2626';

                    // 1. Draw the route (Thicker, Solid Line)
                    const routeLayer = L.polyline(smoothedLatLngs, {
                        color: routeColor,
                        weight: 6,        // Thicker
                        opacity: 0.8,
                        lineCap: 'round',
                        lineJoin: 'round',
                        pane: 'warPane',  // Use custom pane
                        interactive: true // Enable interactions
                    }).addTo(warLayer.current!);

                    // Add hover effects
                    routeLayer.on('mouseover', function (e) {
                        const layer = e.target;
                        layer.setStyle({
                            weight: 10,
                            opacity: 1,
                            color: routeColorHover
                        });
                    });

                    routeLayer.on('mouseout', function (e) {
                        const layer = e.target;
                        layer.setStyle({
                            weight: 6,
                            opacity: 0.8,
                            color: routeColor
                        });
                    });

                    // 2. Start Point (Green Circle)
                    const startPoint = latLngs[0]; // Use original start point
                    L.circleMarker(startPoint, {
                        radius: 6,
                        fillColor: '#10b981', // Green
                        color: '#ffffff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 1,
                        pane: 'warPane' // Use custom pane
                    }).addTo(warLayer.current!)
                        .bindPopup(`<b>${battle.battleName}</b> (시작)`);

                    // 3. End Point (Fortress)
                    const endPoint = smoothedLatLngs[smoothedLatLngs.length - 1];

                    const arrowIcon = L.icon({
                        iconUrl: '/assets/images/warunit/fortress.png',
                        iconSize: [36, 36],
                        iconAnchor: [24, 24]
                    });

                    L.marker(endPoint, {
                        icon: arrowIcon,
                        pane: 'warPane' // Use custom pane
                    }).addTo(warLayer.current!)
                        .bindPopup(`
                            <div style="min-width: 200px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${battle.battleName}</h3>
                                <p style="margin: 4px 0; font-size: 14px;"><strong>전쟁:</strong> ${war.name}</p>
                                <p style="margin: 4px 0; font-size: 14px;"><strong>일시:</strong> ${battle.battleDate}</p>
                                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                                    <p style="margin: 4px 0;"><strong>승리:</strong> ${battle.winnerGeneral}</p>
                                    <p style="margin: 4px 0;"><strong>패배:</strong> ${battle.loserGeneral}</p>
                                </div>
                                <p style="margin-top: 8px; font-size: 13px; color: #666;">${battle.details}</p>
                            </div>
                        `);

                    // Bind popup to the line as well
                    routeLayer.bindPopup(`<b>${battle.battleName}</b><br>${battle.details}`);
                }
            });
        });
    }, [map, warData, isVisible]);

    // Animation Hook
    useWarAnimation({
        map,
        warData,
        isActive: isVisible
    });

    return warLayer;
};

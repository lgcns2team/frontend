import * as L from 'leaflet';

// Viewport Bounding Box for East Asia (approximate)
const VIEWPORT_BBOX = {
    minLng: 70,
    maxLng: 150,
    minLat: 15,
    maxLat: 60
};

export const getGeojsonFileForYear = (year: number) => {
    if (year <= -1000) return 'geojson/world_bc1000.geojson';
    if (year <= -500) return 'geojson/world_bc500.geojson';
    if (year <= 0) return 'geojson/world_bc1.geojson';
    if (year <= 100) return 'geojson/world_100.geojson';
    if (year <= 200) return 'geojson/world_200.geojson';
    if (year <= 400) return 'geojson/world_400.geojson';
    if (year <= 600) return 'geojson/world_600.geojson';
    if (year <= 800) return 'geojson/world_800.geojson';
    if (year <= 1000) return 'geojson/world_1000.geojson';
    if (year <= 1100) return 'geojson/world_1100.geojson';
    if (year <= 1200) return 'geojson/world_1200.geojson';
    if (year <= 1279) return 'geojson/world_1279.geojson';
    if (year <= 1300) return 'geojson/world_1300.geojson';
    if (year <= 1400) return 'geojson/world_1400.geojson';
    if (year <= 1492) return 'geojson/world_1492.geojson';
    if (year <= 1500) return 'geojson/world_1500.geojson';
    if (year <= 1530) return 'geojson/world_1530.geojson';
    if (year <= 1600) return 'geojson/world_1600.geojson';
    if (year <= 1650) return 'geojson/world_1650.geojson';
    if (year <= 1700) return 'geojson/world_1700.geojson';
    if (year <= 1715) return 'geojson/world_1715.geojson';
    if (year <= 1783) return 'geojson/world_1783.geojson';
    if (year <= 1800) return 'geojson/world_1800.geojson';
    if (year <= 1815) return 'geojson/world_1815.geojson';
    if (year <= 1880) return 'geojson/world_1880.geojson';
    if (year <= 1900) return 'geojson/world_1900.geojson';
    if (year <= 1914) return 'geojson/world_1914.geojson';
    if (year <= 1920) return 'geojson/world_1920.geojson';
    if (year <= 1930) return 'geojson/world_1930.geojson';
    if (year <= 1938) return 'geojson/world_1938.geojson';
    if (year <= 1945) return 'geojson/world_1945.geojson';
    if (year <= 1960) return 'geojson/world_1960.geojson';
    if (year <= 1994) return 'geojson/world_1994.geojson';
    if (year <= 2000) return 'geojson/world_2000.geojson';
    if (year <= 2010) return 'geojson/world_2010.geojson';

    return 'geojson/world_2010.geojson';
};

export const getColorByCountry = (name: string) => {
    const colors: Record<string, string> = {
        '고조선': '#7c3aed', 'gojoseon': '#7c3aed',
        '고구려': '#ef4444', 'Goguryeo': '#ef4444', 'Koguryo': '#ef4444',
        '백제': '#3b82f6', 'Baekje': '#3b82f6', 'Paekche': '#3b82f6',
        '신라': '#f59e0b', 'Silla': '#f59e0b', 'Silia': '#f59e0b',
        '가야': '#10b981', 'Gaya': '#10b981',
        '발해': '#6366f1', 'Balhae': '#6366f1', 'Parhae': '#6366f1',
        '고려': '#8b5cf6', 'Goryeo': '#8b5cf6',
        '조선': '#10b981', 'Joseon': '#10b981', 'Korea': '#10b981',
        '대한제국': '#10b981',
        'Korea (USA)': '#3b82f6',
        'Korea (USSR)': '#dc2626',
        '대한민국': '#0043fcff', 'Korea, Republic of': '#0032fcff',
        '북한': '#ff0000ff', 'Korea, Democratic People\'s Republic of': '#ff0000ff', 'USSR': '#dc2626',
        '일본': '#dc2626', 'Japan': '#dc2626', 'Yamato': '#dc2626', 'Wa': '#dc2626',
        '중국': '#ea580c', 'China': '#ea580c',
        '한': '#ea580c', 'Han': '#ea580c',
        '당': '#f97316', 'Tang': '#f97316',
        '송': '#f97316', 'Song': '#f97316',
        '원': '#a855f7', 'Yuan': '#a855f7', 'Mongol': '#a855f7',
        '명': '#eab308', 'Ming': '#eab308',
        '청': '#0ea5e9', 'Qing': '#0ea5e9',
        '흉노': '#a855f7', 'Xiongnu': '#a855f7',
        '거란': '#a855f7', 'Khitan': '#a855f7', 'Liao': '#a855f7',
        '여진': '#a855f7', 'Jurchen': '#a855f7', 'Jin': '#a855f7'
    };

    if (name && colors[name]) {
        return colors[name];
    }
    else {
        for (let key in colors) {
            if (name.includes(key)) return colors[key];
        }
    }

    return '#94a3b8'; // Default
};

// Helper to calculate bounding box of a geometry
const getGeometryBBox = (geometry: any) => {
    let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;

    const updateBounds = (coord: number[]) => {
        const [lng, lat] = coord;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    };

    const traverse = (coords: any) => {
        if (typeof coords[0] === 'number') {
            updateBounds(coords as number[]);
        } else {
            coords.forEach(traverse);
        }
    };

    if (geometry && geometry.coordinates) {
        traverse(geometry.coordinates);
    }

    return { minLng, maxLng, minLat, maxLat };
};

// Check if two bounding boxes intersect
const intersects = (bbox1: typeof VIEWPORT_BBOX, bbox2: typeof VIEWPORT_BBOX) => {
    return !(bbox2.minLng > bbox1.maxLng ||
        bbox2.maxLng < bbox1.minLng ||
        bbox2.minLat > bbox1.maxLat ||
        bbox2.maxLat < bbox1.minLat);
};

export const loadHistoricalBorders = async (
    year: number,
    onCountryClick?: (name: string, properties: any) => void
): Promise<L.Layer | null> => {
    const file = getGeojsonFileForYear(year);
    try {
        const response = await fetch(`/${file}`);
        if (!response.ok) throw new Error('Failed to load GeoJSON');
        const data = await response.json();

        if (data) {
            // Robust filtering using Bounding Box Intersection
            const filteredFeatures = data.features.filter((feature: any) => {
                if (!feature.geometry) return false;
                const featureBBox = getGeometryBBox(feature.geometry);
                return intersects(VIEWPORT_BBOX, featureBBox);
            });

            const filteredData = {
                type: 'FeatureCollection',
                features: filteredFeatures.length > 0 ? filteredFeatures : []
            };

            if (filteredData.features.length === 0) return null;

            const newLayer = L.geoJSON(filteredData as any, {
                style: function (feature: any) {
                    // LineStrings (Rivers, Routes, etc.)
                    if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                        return {
                            color: feature.properties?.stroke || feature.properties?.color || '#64748b',
                            weight: feature.properties?.['stroke-width'] || 1.5,
                            opacity: 0.8,
                            fillOpacity: 0
                        };
                    }
                    // Polygons (Countries)
                    const countryName = feature?.properties?.NAME || feature?.properties?.name;

                    // Hide if no name
                    if (!countryName) {
                        return {
                            stroke: false,
                            fill: false,
                            opacity: 0,
                            fillOpacity: 0
                        };
                    }

                    const fillColor = getColorByCountry(countryName);

                    return {
                        fillColor: fillColor,
                        weight: 1,
                        opacity: 1,
                        color: '#ffffff', // White border for cleaner look
                        dashArray: '3',   // Dashed border for historical feel
                        fillOpacity: 0.4, // Slightly transparent
                    };
                },
                onEachFeature: function (feature: any, layer: L.Layer) {
                    const countryName = feature.properties?.NAME || feature.properties?.name;

                    if (countryName) {
                        const displayName = countryName === 'gojoseon' ? '고조선' : countryName;

                        layer.bindPopup(
                            `<div style="font-family: sans-serif; padding: 8px;">
                                <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${displayName}</h3>
                                <p style="margin: 0; font-size: 12px; color: #6b7280;">${year > 0 ? year + '년' : 'BC ' + Math.abs(year) + '년'}</p>
                            </div>`
                        );

                        // Interactive styling
                        layer.on('mouseover', function (e: any) {
                            const target = e.target;
                            target.setStyle({
                                weight: 2,
                                color: '#333',
                                dashArray: '',
                                fillOpacity: 0.7
                            });
                            target.bringToFront();
                        });

                        layer.on('mouseout', function (e: any) {
                            if (newLayer) {
                                newLayer.resetStyle(e.target);
                            }
                        });

                        // Click handler
                        layer.on('click', function (e: any) {
                            L.DomEvent.stopPropagation(e); // Prevent map click
                            if (onCountryClick) {
                                onCountryClick(displayName, feature.properties);
                            }
                        });
                    }
                }
            });

            return newLayer;
        }
    } catch (error) {
        console.error('Error loading map data:', error);
    }
    return null;
};

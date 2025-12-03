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
    if (year < 790) return 'geojson/world_800.geojson';
    if (year <= 892) return 'geojson/goryeo_balhae_790-892.geojson';
    if (year <= 900) return 'geojson/silla_hubaekjee_893-900.geojson';
    if (year <= 907) return 'geojson/hugoguryeo_904-917.geojson'; // Tang period (if present) or just pre-5Dyn
    if (year <= 917) return 'geojson/hugoguryeo_5dyn_908-917.geojson'; // 5 Dynasties starts 908
    if (year <= 926) return 'geojson/goryeo_samgook_balhae_5dyn_918-926.geojson'; // Balhae + 5 Dynasties
    if (year <= 928) return 'geojson/goryeo_samgook_yo_927-928.geojson'; // Goryeo/Silla/Hubaekje + Liao/5Dyn
    if (year <= 935) return 'geojson/husamgookmal_yo_929-935.geojson'; // Husamgukmal + Liao/5Dyn
    if (year <= 960) return 'geojson/5dae10guk_yo_908-960.geojson';
    if (year <= 1066) return 'geojson/song_yo_yeojin_961-1066.geojson';
    if (year <= 1114) return 'geojson/yo_song_seoha_1067-1114.geojson';
    if (year <= 1351) return 'geojson/geum_seo_song_1115-1351.geojson';
    if (year <= 1350) return 'geojson/goryeo_936-1350.geojson'; // This might be redundant now if 1351 covers it, but keeping for safety if year range overlaps weirdly
    if (year <= 1391) return 'geojson/goryeomal_1351-1391.geojson';
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
        '후백제': '#3b82f6', 'Hubaekje': '#3b82f6', 'Later Baekje': '#3b82f6',
        '후고구려': '#ef4444', 'Hugoguryeo': '#ef4444', 'Later Goguryeo': '#ef4444', 'Taebong': '#ef4444',
        '신라': '#f59e0b', 'Silla': '#f59e0b', 'Silia': '#f59e0b',
        '가야': '#10b981', 'Gaya': '#10b981',
        '발해': '#6366f1', 'Balhae': '#6366f1', 'Parhae': '#6366f1',
        '고려': '#ef4444', 'Goryeo': '#ef4444',
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
        '거란': '#f59e0b', 'Khitan': '#f59e0b', 'Liao': '#f59e0b', // Changed to Amber
        '여진': '#a855f7', 'Jurchen': '#a855f7', 'Jin': '#a855f7',
        '오대십국': '#facc15', 'Five Dynasties': '#facc15', 'Later Jin': '#facc15',
        '서하': '#facc15', 'Western Xia': '#facc15', 'Seoha': '#facc15', // Changed to Yellow for 1115-1351 period consistency
        '금': '#16a34a', 'Jin (Geum)': '#16a34a', 'Geum': '#16a34a', // Jin as Green
        '남송': '#3b82f6', 'Southern Song': '#3b82f6', 'Namsong': '#3b82f6' // Southern Song as Blue
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
    const baseFile = getGeojsonFileForYear(year);
    const filesToLoad = [baseFile];

    // Add Tang Dynasty if in range
    if (year >= 618 && year <= 907) {
        filesToLoad.push('geojson/tang_618-907.geojson');
    }

    try {
        const responses = await Promise.all(filesToLoad.map(file => fetch(`/${file}`)));
        const validResponses = responses.filter(res => res.ok);

        if (validResponses.length === 0) throw new Error('Failed to load any GeoJSON');

        const datas = await Promise.all(validResponses.map(res => res.json()));

        let allFeatures: any[] = [];
        datas.forEach(data => {
            if (data && data.features) {
                allFeatures = [...allFeatures, ...data.features];
            }
        });

        if (allFeatures.length > 0) {
            // Robust filtering using Bounding Box Intersection
            const filteredFeatures = allFeatures.filter((feature: any) => {
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

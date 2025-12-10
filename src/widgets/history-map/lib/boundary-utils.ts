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
    if (year <= 1156) return 'geojson/geum_seo_song_1115-1351.geojson';
    if (year <= 1205) return 'geojson/geum_yeojin_song_1157-1205.geojson';
    if (year <= 1214) return 'geojson/monggol_1206-1214.geojson';
    if (year <= 1234) return 'geojson/monggol_1215-1234.geojson';
    if (year <= 1279) return 'geojson/monggol_1235-1279.geojson';
    if (year <= 1368) return 'geojson/yuan_1280-1368.geojson';
    if (year <= 1370) return 'geojson/yuan_myeong_goryeo_1369-1370.geojson';
    if (year <= 1391) return 'geojson/goryeo_yuan_myeong_yeojin_1371-1391.geojson';
    if (year <= 1432) return 'geojson/joseon_yuan_myeong_yeojin_1392-1432.geojson';
    if (year <= 1626) return 'geojson/yuan_myeong_yeojin_josun_1433-1626.geojson';
    if (year <= 1635) return 'geojson/hugeum_josun_ming_1627-1635.geojson';
    if (year <= 1351) return 'geojson/geum_seo_song_1115-1351.geojson'; // Fallback for other years in this range if needed, but user asked for 1156 limit. Keeping this for now as fallback after 1214? No, user said "adjust to 1115-1156".
    // Actually, let's strictly follow the gap.
    // if (year <= 1351) ...
    // But wait, what about 1215-1351? The original file covered up to 1351.
    // The user instruction "geum_seo_song_1115-1351.geojson 이 파일의 지도가 반영되는 시기를 1115년에서 1156년으로 조정해줘" implies it should NOT be used after 1156?
    // Or maybe they just meant the *start* of the Mongol period?
    // Let's assume they want it back after 1214? Or maybe the Mongol map covers it?
    // Let's stick to the plan: 1115-1156 for geum_seo_song.
    // And 1206-1214 for monggol.
    // For 1215-1351, we might need another file or revert to geum_seo_song.
    // Given the ambiguity, I'll comment out the 1351 line or leave it for >1214?
    // Let's leave the 1351 line but it will only be hit if >1214.
    if (year <= 1351) return 'geojson/geum_seo_song_1115-1351.geojson'; // Keeping this to cover post-1214 if needed, or maybe I should remove it if strictly 1156.
    // Re-reading: "geum_seo_song_1115-1351.geojson 이 파일의 지도가 반영되는 시기를 1115년에서 1156년으로 조정해줘"
    // This sounds like a restriction.
    // But if I remove it for 1215-1351, we have no map.
    // I will assume the user is building the timeline piece by piece.
    // So I will use 1156 limit.
    // And 1206-1214 for Mongol.
    // And 1351 for... well, let's keep it for now but maybe the user will provide more.
    // Actually, to be safe and avoid "no map" for 1215+, I will keep the 1351 line.
    // The user's request "adjust to 1115-1156" might specifically mean "don't show it during the Mongol rise" or something.
    // But 1206-1214 is the Mongol rise.
    // Let's try to be smart:
    // 1115-1156: geum_seo_song
    // 1157-1205: GAP (falls to world_1200 probably)
    // 1206-1214: monggol
    // 1215-1351: geum_seo_song (fallback)

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
        '고려': '#08af91ff', 'Goryeo': '#08af91ff',
        '조선': '#10b981', 'Joseon': '#10b981', 'Korea': '#10b981',
        '대한제국': '#10b981',
        'Korea (USA)': '#3b82f6',
        'Korea (USSR)': '#dc2626',
        '대한민국': '#0043fcff', 'Korea, Republic of': '#0032fcff',
        '북한': '#ff0000ff', 'Korea, Democratic People\'s Republic of': '#ff0000ff', 'USSR': '#dc2626',
        '일본': '#dc2626', 'Japan': '#e45ed0ff', 'Yamato': '#dc2626', 'Wa': '#dc2626',
        '중국': '#ea580c', 'China': '#ea580c',
        '한': '#ea580c', 'Han': '#ea580c',
        '당': '#f97316', 'Tang': '#f97316',
        '송': '#eab308', 'Song': '#eab308', // Yellow
        '원': '#22d3ee', 'Yuan': '#22d3ee', 'Mongol': '#22d3ee', 'Mongol Empire': '#22d3ee', 'Great Yuan': '#22d3ee', 'Northern Yuan': '#22d3ee', // Cyan
        '명': '#eab308', 'Ming': '#eab308',
        '청': '#0ea5e9', 'Qing': '#0ea5e9',
        '흉노': '#a855f7', 'Xiongnu': '#a855f7',
        '거란': '#f59e0b', 'Khitan': '#f59e0b', 'Liao': '#f59e0b',
        '여진': '#84cc16', 'Jurchen': '#84cc16', 'Jin': '#a855f7', 'newyeojin': '#84cc16', 'yeojin': '#84cc16', // Jurchen Green, Jin (Dynasty) Purple
        '후금': '#fa0000ff', 'Later Jin': '#fa0000ff', 'Hugeum': '#fa0000ff', // Dark Red
        '오대십국': '#facc15', 'Five Dynasties': '#facc15', // 'Later Jin': '#facc15' removed to avoid conflict with Manchu Later Jin
        '서하': '#c084fc', 'Western Xia': '#c084fc', 'Seoha': '#c084fc', // Light Purple
        '금': '#a855f7', 'Jin (Geum)': '#a855f7', 'Geum': '#a855f7', // Jin (Dynasty) Purple
        '남송': '#3b82f6', 'Southern Song': '#3b82f6', 'Namsong': '#3b82f6'
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

    // Add Japan for Nam-Buk-Guk and Goryeo periods (approx 698 - 1392)
    // This uses the Joseon-era Japan shape as a placeholder/representation
    if (year >= 698 && year <= 1392) {
        filesToLoad.push('geojson/japan.geojson');
    }

    // Add New Yeojin (961-992)
    if (year >= 961 && year <= 992) {
        filesToLoad.push('geojson/newyeojin_961-992.geojson');
    }

    // Goryeo Territory Override Logic
    let goryeoOverrideFile: string | null = null;
    if (year >= 936 && year <= 992) {
        // Early Goryeo (Unified Goryeo + Hubaekje + Silla)
        goryeoOverrideFile = 'geojson/goryeo_early_936-992.geojson';
    } else if (year >= 993 && year <= 1350) {
        // Standard Goryeo map
        goryeoOverrideFile = 'geojson/goryeo_936-1350.geojson';
    }

    if (goryeoOverrideFile) {
        filesToLoad.push(goryeoOverrideFile);
    }

    try {
        const responses = await Promise.all(filesToLoad.map(file => fetch(`/${file}`)));
        const validResponses = responses.filter(res => res.ok);

        if (validResponses.length === 0) throw new Error('Failed to load any GeoJSON');

        const datas = await Promise.all(validResponses.map(res => res.json()));

        let allFeatures: any[] = [];
        datas.forEach((data, index) => {
            if (data && data.features) {
                let features = data.features;

                // If we are using a Goryeo override file, remove 'Goryeo' from other files
                // to prevent duplicates/overlaps.
                if (goryeoOverrideFile) {
                    const currentFile = filesToLoad[index];
                    if (currentFile !== goryeoOverrideFile) {
                        features = features.filter((f: any) => {
                            const name = f.properties?.NAME || f.properties?.name;
                            return name !== 'Goryeo';
                        });
                    }
                }

                // Jurchen Override Logic
                // If we are in the specific period for new Jurchen territory (961-992),
                // remove 'Jurchen' from other files (like song_yo_yeojin_961-1066.geojson)
                if (year >= 961 && year <= 992) {
                    const currentFile = filesToLoad[index];
                    // The new file is 'geojson/newyeojin_961-992.geojson'
                    if (currentFile !== 'geojson/newyeojin_961-992.geojson') {
                        features = features.filter((f: any) => {
                            const name = f.properties?.NAME || f.properties?.name;
                            return name !== 'Jurchen' && name !== '여진' && name !== 'Jin';
                        });
                    }
                }

                allFeatures = [...allFeatures, ...features];
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
                        // 국가명을 한글로 변환
                        let displayName = countryName;
                        if (countryName === 'gojoseon') displayName = '고조선';
                        else if (countryName === 'Korea' && year >= 1392 && year <= 1910) displayName = '조선';
                        else if (countryName === 'Korea' && year >= 918 && year < 1392) displayName = '고려';
                        else if (countryName === 'Joseon') displayName = '조선';

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

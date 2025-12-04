import L from 'leaflet';

export interface TradeRouteProperties {
    name: string;
    color?: string;
    stroke?: string;
    'stroke-width'?: number;
}

export const TRADE_ROUTE_FILES = [
    '/geojson/test/balhae.geojson',
    '/geojson/test/dang.geojson',
    '/geojson/test/japan.geojson',
    '/geojson/test/shilla.geojson',
    '/geojson/test/Kitai.geojson'
];

export const loadTradeRoutes = async (year: number): Promise<GeoJSON.FeatureCollection[]> => {
    // Trade routes are only visible between 790 and 892
    if (year < 790 || year > 892) {
        return [];
    }

    try {
        const promises = TRADE_ROUTE_FILES.map(async (file) => {
            const response = await fetch(file);
            if (!response.ok) {
                console.warn(`Failed to load trade route file: ${file}`);
                return null;
            }
            return await response.json() as GeoJSON.FeatureCollection;
        });

        const results = await Promise.all(promises);
        return results.filter((result): result is GeoJSON.FeatureCollection => result !== null);
    } catch (error) {
        console.error('Error loading trade routes:', error);
        return [];
    }
};

export const getTradeRouteStyle = (): L.PathOptions => {
    return {
        color: '#0000FF', // Blue
        weight: 2,
        dashArray: '5, 10', // Dotted line
        opacity: 0.8
    };
};

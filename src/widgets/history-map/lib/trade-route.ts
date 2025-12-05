import L from 'leaflet';

import { fetchAllTrades } from '../../../shared/api/trade-api';
import type { TradeData, TradeRouteData } from '../../../shared/api/trade-api';


export interface TradeRouteProperties {
    name: string;
    color?: string;
    stroke?: string;
    'stroke-width'?: number;
}

export interface TradeRouteWithColor {
    route: TradeRouteData;
    trade: TradeData;
}

export const loadTradeRoutes = async (year: number): Promise<TradeRouteWithColor[]> => {
    try {
        // Fetch all trades from backend API
        const trades = await fetchAllTrades();

        // Filter trades by year (both countries must exist in that year)
        const filteredTrades = trades.filter(trade => {
            const startCountryExists = trade.startCountry.foundationYear <= year &&
                (!trade.startCountry.endedYear || trade.startCountry.endedYear >= year);
            const endCountryExists = trade.endCountry.foundationYear <= year &&
                (!trade.endCountry.endedYear || trade.endCountry.endedYear >= year);

            return startCountryExists && endCountryExists;
        });

        // Extract routes with their associated trade data
        const routesWithColor: TradeRouteWithColor[] = [];
        filteredTrades.forEach(trade => {
            trade.routes.forEach(route => {
                routesWithColor.push({ route, trade });
            });
        });

        return routesWithColor;
    } catch (error) {
        console.error('Error loading trade routes:', error);
        return [];
    }
};

export const getTradeRouteStyle = (routeColor?: string): L.PathOptions => {
    return {
        color: routeColor || '#3b82f6', // Default blue
        weight: 2,
        dashArray: '5, 10', // Dotted line
        opacity: 0.8
    };
};

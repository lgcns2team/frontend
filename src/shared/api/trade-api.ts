export interface CountryData {
    countryId: string;
    countryName: string;
    foundationYear: number;
    endedYear: number | null;
}

export interface TradeRouteData {
    routeId: string;
    path: GeoJSON.LineString;
    routeColor: string | null;
}

export interface TradeData {
    tradeId: string;
    startCountry: CountryData;
    endCountry: CountryData;
    tradeYear: number;
    product: string;
    routes: TradeRouteData[];
}

export const fetchAllTrades = async (): Promise<TradeData[]> => {
    try {
        const response = await fetch(`http://localhost:8080/api/trades`);
        if (!response.ok) {
            throw new Error(`Failed to fetch trade data: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching trade data:', error);
        return [];
    }
};

export const fetchTradesByCountryAndYear = async (countryId: string, year: number): Promise<TradeData[]> => {
    try {
        const response = await fetch(`http://localhost:8080/api/trades/${countryId}/${year}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch trade data: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching trade data:', error);
        return [];
    }
};

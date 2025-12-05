import * as L from 'leaflet';

export interface TaperedRouteOptions extends L.PolylineOptions {
    startWidth?: number;
    endWidth?: number;
}

/**
 * Creates a polygon that represents a tapered line (variable width).
 * @param latLngs Array of LatLng points
 * @param options Options including startWidth and endWidth (in pixels, approx)
 * @returns L.Polygon
 */
export const createTaperedPolygon = (latLngs: L.LatLngExpression[], options: TaperedRouteOptions = {}): L.Polygon => {
    const points = latLngs.map(ll => L.latLng(ll));

    if (points.length < 2) {
        return L.polygon([], options);
    }

    const startWidth = options.startWidth ?? 10;
    const endWidth = options.endWidth ?? 2;

    // 1. Calculate total length and cumulative distances
    const distances: number[] = [0];
    let totalLength = 0;

    for (let i = 0; i < points.length - 1; i++) {
        const d = points[i].distanceTo(points[i + 1]);
        totalLength += d;
        distances.push(totalLength);
    }

    // 2. Generate left and right offset points
    const leftPoints: L.LatLng[] = [];
    const rightPoints: L.LatLng[] = [];

    // Helper to get normal vector
    // We need to work in pixel coordinates or meters? 
    // `distanceTo` returns meters.
    // But width is usually in pixels.
    // If we use meters for offset, the line width will scale with zoom.
    // If we want fixed pixel width, we need to re-calculate on zoom, which is complex for a static Polygon.
    // However, L.polyline `weight` is in pixels.
    // To mimic `weight`, we usually want screen pixels.
    // But L.polygon takes LatLngs, which are fixed on the map.
    // So a Polygon will inherently scale with zoom (get larger in pixels as you zoom in).
    // If the user wants "start thick... taper off", usually for a map visualization of a route, 
    // having it scale with the map (fixed meter width) is often acceptable or even desired for "physical" routes.
    // BUT, standard L.polyline keeps constant pixel width.
    // If we want constant pixel width, we'd need a custom Layer that redraws on zoom.
    // OR, we can just accept that it scales.
    // Given the context of "War Layer" and "Trade Layer", these are likely physical flows.
    // Let's try to make it roughly appropriate for the default zoom level (7).
    // At zoom 7, 1 pixel is roughly X meters.
    // Let's use a conversion factor or just use a small degree offset.
    // 1 degree lat is ~111km.
    // Let's work in map degrees directly for simplicity and performance, 
    // treating the width as a "map unit" width.
    // This means it will scale with zoom.

    // Wait, if the user wants it to look like a line, they might expect constant pixel width.
    // But implementing a constant-pixel-width tapered line in Leaflet requires a custom Canvas layer or SVG path manipulation.
    // A simple Polygon will scale.
    // Let's assume scaling is acceptable or even better (zooming in shows more detail).
    // We need to convert "width" (which we'll treat as meters for `distanceTo` logic, or degrees?)
    // `distanceTo` gives meters.
    // Let's calculate offsets in meters and use `destinationPoint` logic.

    // Earth radius in meters
    // const R = 6371000;

    for (let i = 0; i < points.length; i++) {
        const currentDist = distances[i];
        const progress = totalLength > 0 ? currentDist / totalLength : 0;

        // Linear interpolation of width (in meters)
        // We need to map the input "width" (likely pixels) to meters at the current latitude/zoom?
        // Let's just interpret startWidth/endWidth as "kilometers" or "meters" for now?
        // Or we can try to approximate.
        // If the user said "thick" and "thin", and previous code used weight 6-14 (pixels).
        // At zoom 7, 10px is quite wide.
        // Let's try to interpret the options as "meters" if they are large, or use a multiplier.
        // Let's assume the input is "relative thickness" and multiply by a factor to get meters.
        // A trade route across a country might be 10-50km wide visually?
        // Let's use a multiplier. 
        // If startWidth is 10, let's make it 10km? 
        // 10km at zoom 7 is visible.

        const widthMeters = (startWidth * (1 - progress) + endWidth * progress) * 1000; // Convert km input to meters?
        // Or if input is 14 (pixels), 14km is a reasonable width for a country-scale map.

        const halfWidth = widthMeters / 2;

        // Calculate heading
        let heading: number;
        if (i === 0) {
            heading = calculateHeading(points[0], points[1]);
        } else if (i === points.length - 1) {
            heading = calculateHeading(points[i - 1], points[i]);
        } else {
            // Average heading of incoming and outgoing
            const h1 = calculateHeading(points[i - 1], points[i]);
            const h2 = calculateHeading(points[i], points[i + 1]);
            // Average angles properly
            let diff = h2 - h1;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            heading = h1 + diff / 2;
        }

        // Calculate offset points
        // -90 degrees for left, +90 for right
        const left = computeOffset(points[i], halfWidth, heading - 90);
        const right = computeOffset(points[i], halfWidth, heading + 90);

        leftPoints.push(left);
        rightPoints.push(right);
    }

    // Construct polygon: left points -> reversed right points
    const polygonPoints = [...leftPoints, ...rightPoints.reverse()];

    return L.polygon(polygonPoints, {
        ...options,
        stroke: false, // Usually we want a filled shape without outline for the tapered effect
        fillOpacity: options.opacity ?? 0.8,
        fillColor: options.color
    });
};

// Helper to calculate heading between two points (0-360)
function calculateHeading(p1: L.LatLng, p2: L.LatLng): number {
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const dLon = (p2.lng - p1.lng) * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let brng = Math.atan2(y, x);
    return (brng * 180 / Math.PI + 360) % 360;
}

// Helper to compute destination point given distance and bearing
function computeOffset(point: L.LatLng, distance: number, bearing: number): L.LatLng {
    const R = 6371000; // Earth radius in meters
    const lat1 = point.lat * Math.PI / 180;
    const lon1 = point.lng * Math.PI / 180;
    const brng = bearing * Math.PI / 180;

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / R) +
        Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng));

    const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
        Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2));

    return L.latLng(lat2 * 180 / Math.PI, lon2 * 180 / Math.PI);
}

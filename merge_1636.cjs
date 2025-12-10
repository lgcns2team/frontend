const fs = require('fs');
const file = 'public/geojson/cheong_jo_ming_1636-1643.geojson';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Feature indices based on analysis:
// 0: Joseon
// 1: Jurchen
// 2: Qing (Part 1)
// 3: Ming (Part 1)
// 4: Qing (Part 2)
// 5: Ming (Part 2)

const joseon = data.features[0];
const jurchen = data.features[1];
const qingParts = [data.features[2], data.features[4]];
const mingParts = [data.features[3], data.features[5]];

function mergeFeatures(parts, name, color) {
    const geometries = parts.map(p => p.geometry);
    // Assuming all are Polygons, we create a MultiPolygon
    // If some are MultiPolygons, we flatten them.
    const coordinates = [];
    geometries.forEach(g => {
        if (g.type === 'Polygon') {
            coordinates.push(g.coordinates);
        } else if (g.type === 'MultiPolygon') {
            g.coordinates.forEach(c => coordinates.push(c));
        }
    });

    return {
        type: "Feature",
        properties: {
            NAME: name,
            name: name,
            color: color,
            fill: color,
            "fill-opacity": 0.5,
            stroke: color,
            "stroke-width": 2
        },
        geometry: {
            type: "MultiPolygon",
            coordinates: coordinates
        }
    };
}

const newJoseon = {
    ...joseon,
    properties: {
        ...joseon.properties,
        NAME: "Joseon",
        name: "Joseon",
        color: "#10b981" // Green
    }
};

const newJurchen = {
    ...jurchen,
    properties: {
        ...jurchen.properties,
        NAME: "Jurchen",
        name: "Jurchen",
        color: "#22d3ee" // Cyan
    }
};

const newQing = mergeFeatures(qingParts, "Qing", "#ef4444"); // Red
const newMing = mergeFeatures(mingParts, "Ming", "#ea580c"); // Orange

const newFeatureCollection = {
    type: "FeatureCollection",
    features: [newJoseon, newJurchen, newQing, newMing]
};

fs.writeFileSync(file, JSON.stringify(newFeatureCollection, null, 2));
console.log('Merged and renamed features successfully.');

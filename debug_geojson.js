const fs = require('fs');

const data = JSON.parse(fs.readFileSync('public/geojson/world_200.geojson', 'utf8'));

const koreaFeatures = data.features.filter(f => {
    if (!f.geometry) return false;

    // Simple check: is any point in the Korea box?
    // Box: 124 < lng < 131, 33 < lat < 43

    const checkPoint = (lng, lat) => {
        return lng > 124 && lng < 131 && lat > 33 && lat < 43;
    };

    const traverse = (coords) => {
        if (typeof coords[0] === 'number') {
            return checkPoint(coords[0], coords[1]);
        }
        return coords.some(traverse);
    };

    return traverse(f.geometry.coordinates);
});

console.log('Features in Korea region (World 200):');
koreaFeatures.forEach(f => {
    console.log(`Name: ${f.properties.NAME}, Type: ${f.geometry.type}`);
});

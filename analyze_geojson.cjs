const fs = require('fs');

const data = JSON.parse(fs.readFileSync('public/geojson/monggol_1206-1214.geojson', 'utf8'));

data.features.forEach((f, i) => {
    let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
    const traverse = (coords) => {
        if (typeof coords[0] === 'number') {
            const [lng, lat] = coords;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        } else {
            coords.forEach(traverse);
        }
    };
    traverse(f.geometry.coordinates);
    console.log(`Feature ${i}: ${f.properties.NAME || f.properties.name}`);
    console.log(`  BBox: [${minLng.toFixed(2)}, ${minLat.toFixed(2)}] to [${maxLng.toFixed(2)}, ${maxLat.toFixed(2)}]`);
    console.log(`  Center: [${((minLng + maxLng) / 2).toFixed(2)}, ${((minLat + maxLat) / 2).toFixed(2)}]`);
});

const fs = require('fs');

const inputFile = 'public/geojson/yuan_myeong_yeojin_josun_1433-1633.geojson';

try {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    console.log(`Processing ${inputFile}...`);

    const jurchenFeatures = [];
    const otherFeatures = [];

    data.features.forEach(feature => {
        const name = feature.properties.NAME || feature.properties.name;
        if (name === 'Jurchen') {
            jurchenFeatures.push(feature);
        } else {
            otherFeatures.push(feature);
        }
    });

    if (jurchenFeatures.length < 2) {
        console.log('Not enough Jurchen features to merge.');
        process.exit(0);
    }

    console.log(`Found ${jurchenFeatures.length} Jurchen features. Merging...`);

    // Create a MultiPolygon from the Polygons
    const mergedCoordinates = [];
    jurchenFeatures.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
            mergedCoordinates.push(feature.geometry.coordinates);
        } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(poly => mergedCoordinates.push(poly));
        }
    });

    const mergedFeature = {
        type: 'Feature',
        properties: jurchenFeatures[0].properties, // Use properties from the first one
        geometry: {
            type: 'MultiPolygon',
            coordinates: mergedCoordinates
        }
    };

    const newFeatureCollection = {
        type: 'FeatureCollection',
        features: [...otherFeatures, mergedFeature]
    };

    fs.writeFileSync(inputFile, JSON.stringify(newFeatureCollection, null, 2));
    console.log(`Successfully merged Jurchen features in ${inputFile}`);

} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}

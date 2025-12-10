const fs = require('fs');

const inputFile = 'public/geojson/yuan_myeong_yeojin_1371-1432.geojson';
const goryeoOutputFile = 'public/geojson/goryeo_yuan_myeong_yeojin_1371-1391.geojson';
const joseonOutputFile = 'public/geojson/joseon_yuan_myeong_yeojin_1392-1432.geojson';

try {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    console.log(`Processing ${inputFile}...`);

    // Analysis showed:
    // Feature 1: Korea (Goryeo/Joseon)
    // Feature 2: Northern Yuan
    // Feature 3: Ming
    // Feature 4: Jurchen

    // Create Goryeo version
    const goryeoFeatures = JSON.parse(JSON.stringify(data.features)); // Deep copy
    goryeoFeatures[0].properties.NAME = 'Goryeo';
    goryeoFeatures[0].properties.name = 'Goryeo';
    goryeoFeatures[0].properties.color = '#ef4444'; // Red

    goryeoFeatures[1].properties.NAME = 'Northern Yuan';
    goryeoFeatures[1].properties.name = 'Northern Yuan';
    goryeoFeatures[1].properties.color = '#22d3ee'; // Cyan

    goryeoFeatures[2].properties.NAME = 'Ming';
    goryeoFeatures[2].properties.name = 'Ming';
    goryeoFeatures[2].properties.color = '#eab308'; // Yellow

    goryeoFeatures[3].properties.NAME = 'Jurchen';
    goryeoFeatures[3].properties.name = 'Jurchen';
    goryeoFeatures[3].properties.color = '#ef4444'; // Red (or Green? Usually Jurchen is Green in this app, but let's stick to previous pattern if any. Actually Jurchen was Green in 1157-1205. Let's make it Green #84cc16 to distinguish from Goryeo Red)
    // Wait, in 1433-1633 plan I said Jurchen Green.
    goryeoFeatures[3].properties.color = '#84cc16';

    const goryeoCollection = {
        type: 'FeatureCollection',
        features: goryeoFeatures
    };
    fs.writeFileSync(goryeoOutputFile, JSON.stringify(goryeoCollection, null, 2));
    console.log(`Created ${goryeoOutputFile}`);

    // Create Joseon version
    const joseonFeatures = JSON.parse(JSON.stringify(data.features)); // Deep copy
    joseonFeatures[0].properties.NAME = 'Joseon';
    joseonFeatures[0].properties.name = 'Joseon';
    joseonFeatures[0].properties.color = '#10b981'; // Green (Joseon color)

    joseonFeatures[1].properties.NAME = 'Northern Yuan';
    joseonFeatures[1].properties.name = 'Northern Yuan';
    joseonFeatures[1].properties.color = '#22d3ee'; // Cyan

    joseonFeatures[2].properties.NAME = 'Ming';
    joseonFeatures[2].properties.name = 'Ming';
    joseonFeatures[2].properties.color = '#eab308'; // Yellow

    joseonFeatures[3].properties.NAME = 'Jurchen';
    joseonFeatures[3].properties.name = 'Jurchen';
    joseonFeatures[3].properties.color = '#84cc16'; // Green

    const joseonCollection = {
        type: 'FeatureCollection',
        features: joseonFeatures
    };
    fs.writeFileSync(joseonOutputFile, JSON.stringify(joseonCollection, null, 2));
    console.log(`Created ${joseonOutputFile}`);

} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}

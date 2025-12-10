const fs = require('fs');

const inputFile = 'public/geojson/monggol_1206-1214.geojson';
const outputFile = 'public/geojson/geum_yeojin_song_1157-1205.geojson';

try {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    // Filter out Mongol Empire
    const filteredFeatures = data.features.filter(f => {
        const name = f.properties.NAME || f.properties.name;
        return name !== 'Mongol Empire' && name !== 'Mongol';
    });

    data.features = filteredFeatures;

    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`Successfully created ${outputFile} with ${filteredFeatures.length} features.`);
} catch (err) {
    console.error('Error processing GeoJSON:', err);
    process.exit(1);
}

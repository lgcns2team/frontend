const fs = require('fs');

const inputFile = 'public/geojson/yuan_myeong_yeojin_josun_1433-1633.geojson';

try {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    console.log(`Analyzing ${inputFile}...`);

    data.features.forEach((feature, index) => {
        const name = feature.properties.NAME || feature.properties.name;
        if (name === 'Jurchen') {
            console.log(`Feature ${index}: Name="${name}", Type=${feature.geometry.type}`);
            if (feature.geometry.type === 'Polygon') {
                console.log(`  Coordinates length: ${feature.geometry.coordinates.length}`);
                // console.log(`  First point: ${JSON.stringify(feature.geometry.coordinates[0][0])}`);
            }
        }
    });

} catch (err) {
    console.error('Error:', err);
}

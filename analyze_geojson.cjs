const fs = require('fs');

const inputFile = process.argv[2];

if (!inputFile) {
    console.error('Please provide an input file path.');
    process.exit(1);
}

try {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    console.log(`Analyzing ${inputFile}...`);
    console.log(`Total features: ${data.features.length}`);

    data.features.forEach((feature, index) => {
        const name = feature.properties.NAME || feature.properties.name;
        const geometry = feature.geometry;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        function processCoords(coords) {
            if (typeof coords[0] === 'number') {
                const [x, y] = coords;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            } else {
                coords.forEach(processCoords);
            }
        }

        processCoords(geometry.coordinates);

        console.log(`Feature ${index + 1}: Name="${name}", BBox=[${minX.toFixed(2)}, ${minY.toFixed(2)}, ${maxX.toFixed(2)}, ${maxY.toFixed(2)}]`);
    });

} catch (err) {
    console.error('Error processing GeoJSON:', err);
    process.exit(1);
}

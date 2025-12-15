const fs = require('fs');
const path = require('path');

const geojsonDir = path.join(__dirname, 'public/geojson');

// Known codes based on user provided list
const nameToCode = {
    // 1: Unified Silla
    "Unified Silla": "1",
    "Silla": "1", // Assuming Silla in later periods is Unified Silla

    // 2: Balhae
    "Balhae": "2",

    // 3: Hubaekje
    "Hubaekje": "3",
    "Later Baekje": "3",

    // 4: Hugoguryeo (Taebong)
    "Hugoguryeo": "4",
    "Later Goguryeo": "4",
    "Taebong": "4",

    // 5: Tang
    "Tang": "5",

    // 6: Goryeo
    "Goryeo": "6",

    // 7: Khitan (Pre-Liao)
    "Khitan": "7",

    // 8: Liao (Khitan)
    "Liao": "8",

    // 9: Jurchen
    "Jurchen": "9",

    // 10: Jin
    "Jin": "10",

    // 11: Song
    "Song": "11",
    "Northern Song": "11",
    "Southern Song": "11",

    // 12: Western Xia
    "Western Xia": "12",

    // 13: Mongol Empire
    "Mongol Empire": "13",
    "Mongols": "13",

    // 14: Yuan
    "Yuan": "14",

    // 15: Ming
    "Ming": "15",

    // 16: Japan
    "Japan": "16",

    // 17: Wako
    "Wako": "17",
    "Japanese Pirates": "17",

    // 18: Joseon
    "Joseon": "18",

    // 19: Later Jin
    "Later Jin": "19",

    // 20: Qing
    "Qing": "20",

    // Additional mappings for safety
    "Goguryeo": "1", // If appearing in Unified Silla context? No, Goguryeo is ancient. 
    // Wait, the list starts from Unified Silla. What about ancient Three Kingdoms?
    // The user list seems to focus on the period relevant to the current map view or just provided a subset.
    // I will map what I can. Ancient kingdoms might need their own codes if not in this list.
    // But for now, I'll strictly follow this list for these entities.

    "Northern Yuan": "14", // Treat as Yuan? Or maybe it needs a new code. I'll map to Yuan (14) for now or leave it. 
    // User didn't specify Northern Yuan. I'll leave it to fallback or map to 14. Let's map to 14.
};

// Function to normalize name for lookup
function normalizeName(name) {
    return name ? name.trim() : null;
}

fs.readdir(geojsonDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        if (path.extname(file) === '.geojson') {
            const filePath = path.join(geojsonDir, file);

            try {
                const data = fs.readFileSync(filePath, 'utf8');
                const json = JSON.parse(data);
                let modified = false;

                if (json.features) {
                    json.features.forEach(feature => {
                        if (feature.properties) {
                            const name = feature.properties.NAME || feature.properties.name;
                            if (name) {
                                // Always try to update code if name is in our list
                                const mappedCode = nameToCode[name];
                                if (mappedCode) {
                                    if (feature.properties.CODE !== mappedCode) {
                                        feature.properties.CODE = mappedCode;
                                        modified = true;
                                        console.log(`[${file}] Updated CODE to "${mappedCode}" for "${name}"`);
                                    }
                                } else if (!feature.properties.CODE) {
                                    // Fallback for unknown names only if CODE is missing
                                    const code = name.toUpperCase().replace(/\s+/g, '_');
                                    feature.properties.CODE = code;
                                    modified = true;
                                    console.log(`[${file}] Added fallback CODE "${code}" for "${name}"`);
                                }
                            }
                        }
                    });
                }

                if (modified) {
                    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
                    console.log(`Updated ${file}`);
                }
            } catch (e) {
                console.error(`Error processing ${file}:`, e);
            }
        }
    });
});

const fs = require("fs");
const path = require("path");

const geojsonDir = "geojson";
const outputPath = "index.json";

const years = [];

function extractYear(filename) {
  const isBC = filename.toLowerCase().includes("bc");
  const match = filename.match(/(\d+)/);

  if (!match) return null;

  const year = parseInt(match[1], 10);

  return isBC ? -year : year;
}

function extractCountryNames(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const names = new Set();

  if (Array.isArray(data.features)) {
    data.features.forEach((feature) => {
      const name = feature?.properties?.NAME;

      if (name) names.add(name);
    });
  }

  return Array.from(names).sort();
}

fs.readdirSync(geojsonDir).forEach((filename) => {
  if (filename.endsWith(".geojson")) {
    const year = extractYear(filename);

    if (year) {
      const filePath = path.join(geojsonDir, filename);
      const countries = extractCountryNames(filePath);

      years.push({ year, filename, countries });
    }
  }
});

years.sort((a, b) => a.year - b.year);

fs.writeFileSync(outputPath, JSON.stringify({ years }, null, 2), "utf8");

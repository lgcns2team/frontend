import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 조선 시대 파일 목록 (1392-1910)
const joseonFiles = [
    'world_1400.geojson',
    'world_1492.geojson',
    'world_1500.geojson',
    'world_1530.geojson',
    'world_1600.geojson',
    'world_1650.geojson',
    'world_1700.geojson',
    'world_1715.geojson',
    'world_1783.geojson',
    'world_1800.geojson',
    'world_1815.geojson',
    'world_1880.geojson',
    'world_1900.geojson'
];

const geojsonDir = path.join(__dirname, '../public/geojson');

joseonFiles.forEach(fileName => {
    const filePath = path.join(geojsonDir, fileName);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  파일 없음: ${fileName}`);
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Korea를 조선으로 변경
        content = content.replace(/"NAME":\s*"Korea"/g, '"NAME": "조선"');
        content = content.replace(/"ABBREVN":\s*"Korea"/g, '"ABBREVN": "조선"');
        content = content.replace(/"SUBJECTO":\s*"Korea"/g, '"SUBJECTO": "조선"');
        content = content.replace(/"PARTOF":\s*"Korea"/g, '"PARTOF": "조선"');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ 수정 완료: ${fileName}`);
    } catch (error) {
        console.error(`❌ 오류 발생 (${fileName}):`, error.message);
    }
});

console.log('\n🎉 모든 파일 처리 완료!');

import './MapLayers.css';
import { getEraForYear } from '../../../shared/config/era-theme';

interface MapLayersProps {
    activeLayer: 'default' | 'battles' | 'trade' | 'people';
    onLayerChange: (layer: 'default' | 'battles' | 'trade' | 'people') => void;
    currentYear: number;
}

export const MapLayers = ({ activeLayer, onLayerChange, currentYear }: MapLayersProps) => {
    const toggleLayer = (layer: 'battles' | 'trade' | 'people') => {
        if (activeLayer === layer) {
            onLayerChange('default');
        } else {
            onLayerChange(layer);
        }
    };

    // Get current era folder name
    const currentEra = getEraForYear(currentYear);
    const eraFolder = currentEra.id;

    // Construct image paths based on current era
    const warImage = `/assets/images/${eraFolder}/war.png`;
    const tradeImage = `/assets/images/${eraFolder}/trade.png`;
    const cultureImage = `/assets/images/${eraFolder}/culture.png`;

    return (
        <div className="layer-tabs">
            <button
                className={`tab-btn battles ${activeLayer === 'battles' ? 'active' : ''}`}
                onClick={() => toggleLayer('battles')}
                aria-label="전쟁/동맹"
                style={{ backgroundImage: `url(${warImage})` }}
            />
            <button
                className={`tab-btn trade ${activeLayer === 'trade' ? 'active' : ''}`}
                onClick={() => toggleLayer('trade')}
                aria-label="무역"
                style={{ backgroundImage: `url(${tradeImage})` }}
            />
            <button
                className={`tab-btn religion ${activeLayer === 'people' ? 'active' : ''}`}
                onClick={() => toggleLayer('people')}
                aria-label="종교/문화"
                style={{ backgroundImage: `url(${cultureImage})` }}
            />
        </div>
    );
};

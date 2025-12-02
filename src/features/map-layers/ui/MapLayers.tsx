import './MapLayers.css';

interface MapLayersProps {
    activeLayer: 'default' | 'battles' | 'trade' | 'people';
    onLayerChange: (layer: 'default' | 'battles' | 'trade' | 'people') => void;
}

export const MapLayers = ({ activeLayer, onLayerChange }: MapLayersProps) => {
    const toggleLayer = (layer: 'battles' | 'trade' | 'people') => {
        if (activeLayer === layer) {
            onLayerChange('default');
        } else {
            onLayerChange(layer);
        }
    };

    return (
        <div className="layer-tabs">
            <button
                className={`tab-btn ${activeLayer === 'battles' ? 'active' : ''}`}
                onClick={() => toggleLayer('battles')}
            >
                전쟁/동맹
            </button>
            <button
                className={`tab-btn ${activeLayer === 'trade' ? 'active' : ''}`}
                onClick={() => toggleLayer('trade')}
            >
                무역
            </button>
            <button
                className={`tab-btn ${activeLayer === 'people' ? 'active' : ''}`}
                onClick={() => toggleLayer('people')}
            >
                종교/문화
            </button>
        </div>
    );
};

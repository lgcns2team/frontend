import type { ReactNode } from 'react';
import './FloatingPanel.css';
import { getEraFrameImage } from '../../../shared/config/era-theme';

interface FloatingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    width?: number;
    subtitle?: ReactNode;
    currentYear: number;
}

export const FloatingPanel = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    width,
    currentYear
}: FloatingPanelProps) => {
    if (!isOpen) return null;

    const frameImage = getEraFrameImage(currentYear);

    return (
        <div
            className="floating-panel"
            style={{
                ...(width && { width: `${width}px` }),
                ...(frameImage && {
                    '--frame-image': `url(${frameImage})`
                } as React.CSSProperties)
            }}
        >
            <div className="floating-panel-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h3 className="floating-panel-title">{title}</h3>
                    {subtitle && <div className="floating-panel-subtitle">{subtitle}</div>}
                </div>
                <button className="floating-panel-close" onClick={onClose}>×</button>
            </div>
            <div className="floating-panel-content">
                {children}
            </div>
        </div>
    );
};

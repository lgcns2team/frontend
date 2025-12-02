import type { ReactNode } from 'react';
import './FloatingPanel.css';

interface FloatingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    width?: number;
}

export const FloatingPanel = ({
    isOpen,
    onClose,
    title,
    children,
    width = 350
}: FloatingPanelProps) => {
    if (!isOpen) return null;

    return (
        <div className="floating-panel" style={{ width: `${width}px` }}>
            <div className="floating-panel-header">
                <h3 className="floating-panel-title">{title}</h3>
                <button className="floating-panel-close" onClick={onClose}>×</button>
            </div>
            <div className="floating-panel-content">
                {children}
            </div>
        </div>
    );
};

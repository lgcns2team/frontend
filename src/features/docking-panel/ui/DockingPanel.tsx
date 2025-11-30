import { useState, useEffect, useRef, type ReactNode } from 'react';
import './DockingPanel.css';

interface DockingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    initialWidth?: number;
    minWidth?: number;
    maxWidth?: number;
}

export const DockingPanel = ({
    isOpen,
    onClose,
    title,
    children,
    initialWidth = 600,
    minWidth = 300,
    maxWidth = 900
}: DockingPanelProps) => {
    const [width, setWidth] = useState(initialWidth);
    const isResizing = useRef(false);

    const startResizing = (e: React.MouseEvent) => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        e.preventDefault(); // Prevent text selection
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;

        // Calculate new width: Window Width - Mouse X
        const newWidth = window.innerWidth - e.clientX;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            setWidth(newWidth);
        }
    };

    const stopResizing = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResizing);
        };
    }, []);

    return (
        <div
            className={`docking-panel ${isOpen ? 'open' : 'closed'}`}
            style={{ width: `${width}px` }}
        >
            {/* Resize Handle */}
            <div className="resize-handle" onMouseDown={startResizing}></div>

            {/* Header */}
            <div className="panel-header">
                <button className="close-btn" onClick={onClose} aria-label="Close panel">
                    →
                </button>
                <h2 className="panel-title">{title}</h2>
                <div style={{ width: '24px' }}></div> {/* Spacer for centering if needed */}
            </div>

            {/* Content */}
            <div className="panel-content">
                {children}
            </div>
        </div>
    );
};

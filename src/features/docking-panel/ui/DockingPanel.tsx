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
    maxWidth = 1600,
    headerRightContent,
    width: controlledWidth
}: DockingPanelProps & { headerRightContent?: ReactNode, width?: number }) => {
    const [width, setWidth] = useState(initialWidth);
    const isResizing = useRef(false);

    useEffect(() => {
        if (controlledWidth) {
            setWidth(controlledWidth);
        }
    }, [controlledWidth]);

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
                <div className="header-left">
                    <button className="close-btn" onClick={onClose} aria-label="Close panel">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.5 4.5L21 12M21 12L13.5 19.5M21 12H3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h2 className="panel-title">{title}</h2>
                </div>
                <div className="header-right">
                    {headerRightContent}
                </div>
            </div>

            {/* Content */}
            <div className="panel-content">
                {children}
            </div>
        </div>
    );
};

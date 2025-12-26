import { useState, useEffect, useRef } from 'react';
import './SidebarMenu.css';

import { getEraForYear } from '../../../shared/config/era-theme';

interface SidebarMenuProps {
    onItemClick?: (id: string) => void;
    currentYear: number;
    isDockingPanelOpen?: boolean;
}

export const SidebarMenu = ({ onItemClick, currentYear, isDockingPanelOpen = false }: SidebarMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const era = getEraForYear(currentYear);

    // Close sidebar when clicking outside (but not when docking panel is open)
    useEffect(() => {
        // Don't enable click-outside detection if docking panel is open
        if (isDockingPanelOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, isDockingPanelOpen]);

    const menuItems = [
        { id: 'search', icon: `/assets/images/${era.id}/issue.png`, label: '주요사건' },
        { id: 'textbook', icon: `/assets/images/${era.id}/book.png`, label: '교과서' },
        { id: 'people', icon: `/assets/images/${era.id}/human.png`, label: '인물' },
        { id: 'discussion', icon: `/assets/images/${era.id}/discussion.png`, label: '토론' },

    ];

    return (
        <div className={`sidebar-menu ${isOpen ? 'open' : 'closed'}`} ref={sidebarRef}>
            {/* Closed State: Single Roll Image */}
            {!isOpen && (
                <div className="scroll-closed" onClick={() => setIsOpen(true)}>
                </div>
            )}

            {/* Open State: 3-Part Structure */}
            {isOpen && (
                <div className="scroll-open-container">
                    <div className="scroll-top" onClick={() => setIsOpen(false)}>
                    </div>
                    <div className="scroll-middle">
                        <div className="menu-items-container">
                            {menuItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`menu-item-zone centered-item ${item.id === 'people' ? 'people-item' : ''} ${item.id === 'discussion' ? 'discussion-item' : ''}`}
                                    title={item.label}
                                    onClick={() => onItemClick?.(item.id)}
                                >
                                    <div className="menu-image-wrapper">
                                        <img src={item.icon} alt={item.label} className="menu-icon" />
                                        <span className="menu-overlay-text">{item.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="scroll-bottom" onClick={() => setIsOpen(false)}></div>
                </div>
            )}
        </div>
    );
};

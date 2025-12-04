import { useState } from 'react';
import './SidebarMenu.css';

interface SidebarMenuProps {
    onItemClick?: (id: string) => void;
}

export const SidebarMenu = ({ onItemClick }: SidebarMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { id: 'search', icon: '🔍', label: '주요사건' },
        { id: 'textbook', icon: '📚', label: '교과서' },
        { id: 'people', icon: '👤', label: '인물' },
        { id: 'discussion', icon: '💬', label: '토론' },
        { id: 'settings', icon: '⚙️', label: '설정' },
    ];

    return (
        <div className={`sidebar-menu ${isOpen ? 'open' : 'closed'}`}>
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
                                    className="menu-item-zone"
                                    title={item.label}
                                    onClick={() => onItemClick?.(item.id)}
                                >
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="scroll-bottom"></div>
                </div>
            )}
        </div>
    );
};

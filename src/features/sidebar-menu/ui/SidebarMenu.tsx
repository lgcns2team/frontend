import { useState } from 'react';
import './SidebarMenu.css';

interface SidebarMenuProps {
    onItemClick?: (id: string) => void;
}

export const SidebarMenu = ({ onItemClick }: SidebarMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { id: 'search', icon: '/assets/images/goryeo/issue.png', label: '주요사건' },
        { id: 'textbook', icon: '/assets/images/goryeo/book.png', label: '교과서' },
        { id: 'people', icon: '/assets/images/goryeo/human.png', label: '인물' },
        { id: 'discussion', icon: '/assets/images/goryeo/discussion.png', label: '토론' },
        { id: 'settings', icon: '/assets/images/goryeo/set.png', label: '설정' },
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
                                    <img src={item.icon} alt={item.label} className="menu-icon" />
                                    <span>{item.label}</span>
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

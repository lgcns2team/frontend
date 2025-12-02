import { useState } from 'react';
import './SidebarMenu.css';

interface SidebarMenuProps {
    onItemClick: (id: string) => void;
}

export const SidebarMenu = ({ onItemClick }: SidebarMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { id: 'search', icon: '🔍', label: '주요사건' },
        { id: 'textbook', icon: '📖', label: '교과서' },
        { id: 'people', icon: '👑', label: '인물' },
        { id: 'discussion', icon: '💬', label: '토론' },
        { id: 'settings', icon: '⚙️', label: '설정' },
    ];

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`sidebar-scroll-container ${isOpen ? 'open' : 'closed'}`}>
            {/* Top Roller (Click to toggle) */}
            <div className="scroll-roller top" onClick={handleToggle}>
                <div className="roller-knob left"></div>
                <div className="roller-body">
                    <span className="scroll-title">역사 탐험</span>
                    <span className="scroll-arrow">{isOpen ? '▲' : '▼'}</span>
                </div>
                <div className="roller-knob right"></div>
            </div>

            {/* Scroll Content (Hidden when closed) */}
            <div className="scroll-content-wrapper">
                <div className="scroll-paper">
                    <div className="menu-items">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                className="feature-btn"
                                onClick={() => onItemClick(item.id)}
                            >
                                <span className="btn-icon">{item.icon}</span>
                                <span className="btn-label">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Roller */}
            <div className="scroll-roller bottom">
                <div className="roller-knob left"></div>
                <div className="roller-body"></div>
                <div className="roller-knob right"></div>
            </div>
        </div>
    );
};

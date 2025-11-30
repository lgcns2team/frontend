import './SidebarMenu.css';

interface SidebarMenuProps {
    onItemClick?: (id: string) => void;
}

export const SidebarMenu = ({ onItemClick }: SidebarMenuProps) => {
    const menuItems = [
        { id: 'search', icon: '🔍', label: '주요사건' },
        { id: 'textbook', icon: '📚', label: '교과서' },
        { id: 'people', icon: '👤', label: '인물' },
        { id: 'discussion', icon: '💬', label: '토론' },
        { id: 'settings', icon: '⚙️', label: '설정' },
    ];

    return (
        <div className="sidebar-menu">
            {menuItems.map((item) => (
                <button
                    key={item.id}
                    className="feature-btn"
                    title={item.label}
                    onClick={() => onItemClick?.(item.id)}
                >
                    {item.icon}
                </button>
            ))}
        </div>
    );
};

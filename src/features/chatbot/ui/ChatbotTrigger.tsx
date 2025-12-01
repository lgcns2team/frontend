import './ChatbotTrigger.css';

interface ChatbotTriggerProps {
    onClick?: () => void;
}

export const ChatbotTrigger = ({ onClick }: ChatbotTriggerProps) => {
    return (
        <button className="ai-chat-btn" onClick={onClick}>
            <div className="ai-icon">H.AI</div>
            <span>챗봇</span>
        </button>
    );
};

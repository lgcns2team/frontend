import { useNavigate } from 'react-router-dom';
import './GuestLoginPrompt.css';

interface GuestLoginPromptProps {
    featureName?: string;
}

/**
 * 게스트 사용자에게 로그인 유도 화면을 표시하는 컴포넌트
 * - "로그인 시에만 사용 가능한 기능입니다" 메시지
 * - "로그인 하기" 버튼 (게스트 로그인 버튼과 같은 스타일)  
 */
export const GuestLoginPrompt = ({ featureName }: GuestLoginPromptProps) => {
    const navigate = useNavigate();

    const handleLogin = () => {
        // 로그아웃 처리 (userRole 제거)
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        navigate('/login');
    };

    return (
        <div className="guest-login-prompt">
            <div className="guest-login-prompt-content">
                <p className="guest-login-message">
                    {featureName ? <>{featureName} 기능은 로그인 시에만<br />사용 가능한 기능입니다</> : '로그인 시에만 사용 가능한 기능입니다'}
                </p>
                <button className="guest-login-button" onClick={handleLogin}>
                    로그인 하기
                </button>
            </div>
        </div>
    );
};

/**
 * 현재 사용자가 게스트인지 확인
 */
export const isGuestUser = (): boolean => {
    const role = localStorage.getItem('userRole');
    return role === 'GUEST' || !role;
};

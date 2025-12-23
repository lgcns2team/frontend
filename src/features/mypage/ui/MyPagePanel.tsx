import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../../shared/api/auth-api';
import './MyPagePanel.css';

interface MyPagePanelProps {
    onClose: () => void;
}

export const MyPagePanel = ({ onClose }: MyPagePanelProps) => {
    const navigate = useNavigate();
    const panelRef = useRef<HTMLDivElement>(null);

    // Retrieve user info from localStorage
    const name = localStorage.getItem('userName') || '사용자';
    const role = localStorage.getItem('userRole') as 'TEACHER' | 'STUDENT' | 'GUEST' | null;
    const grade = localStorage.getItem('userGrade');
    const classroom = localStorage.getItem('userClassroom');
    const teacherCode = localStorage.getItem('teacher_code');

    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            authApi.logout();
            navigate('/');
        }
    };

    // Outside click detection
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            // Check if click is inside the panel
            if (panelRef.current && panelRef.current.contains(target)) {
                return;
            }

            // Check if click is on the profile button (to allow toggle)
            const profileButton = document.querySelector('.header-controls-group > div:first-child');
            if (profileButton && profileButton.contains(target)) {
                return;
            }

            // Click is outside both panel and profile button, close the panel
            onClose();
        };

        // Add event listener with a slight delay to prevent immediate closing
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // 역할별 표시 텍스트 및 클래스
    const getRoleDisplay = () => {
        if (role === 'TEACHER') return { text: '선생님', className: 'role-teacher' };
        if (role === 'STUDENT') return { text: '학생', className: 'role-student' };
        // GUEST 또는 null/undefined는 게스트로 처리
        return { text: '게스트', className: 'role-guest' };
    };
    const roleDisplay = getRoleDisplay();

    return (
        <div ref={panelRef} className="mypage-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mypage-header">
                <span className="mypage-title">마이 페이지</span>
            </div>

            <div className="mypage-content">
                <div className="info-row">
                    <span className="info-label">이름</span>
                    <span className="info-value">{name}</span>
                </div>

                <div className="info-row">
                    <span className="info-label">직책</span>
                    <span className={`role-badge ${roleDisplay.className}`}>
                        {roleDisplay.text}
                    </span>
                </div>

                {role === 'STUDENT' && grade && classroom && (
                    <div className="info-row">
                        <span className="info-label">소속</span>
                        <span className="info-value">{grade}학년 {classroom}반</span>
                    </div>
                )}

                {role === 'TEACHER' && teacherCode && (
                    <div className="info-row">
                        <span className="info-label">교사 코드</span>
                        <span className="info-value">{teacherCode}</span>
                    </div>
                )}

                <button className="logout-button" onClick={handleLogout}>
                    로그아웃
                </button>
            </div>
        </div>
    );
};

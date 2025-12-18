import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../../shared/api/auth-api';
import './MyPagePanel.css';

interface MyPagePanelProps {
    onClose: () => void;
}

export const MyPagePanel = ({ onClose }: MyPagePanelProps) => {
    const navigate = useNavigate();

    // Retrieve user info from localStorage
    const name = localStorage.getItem('userName') || '사용자';
    const role = localStorage.getItem('userRole') as 'TEACHER' | 'STUDENT' | null;
    const grade = localStorage.getItem('userGrade');
    const classroom = localStorage.getItem('userClassroom');
    const teacherCode = localStorage.getItem('teacher_code');

    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            authApi.logout();
            navigate('/');
        }
    };

    return (
        <div className="mypage-panel" onClick={(e) => e.stopPropagation()}>
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
                    <span className={`role-badge ${role === 'TEACHER' ? 'role-teacher' : 'role-student'}`}>
                        {role === 'TEACHER' ? '선생님' : '학생'}
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

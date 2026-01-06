import { Navigate, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
    children: React.ReactNode;
}

/**
 * 인증 가드 컴포넌트
 * - userRole이 설정되어 있으면 접근 허용
 * - 설정되지 않으면 로그인 페이지로 리다이렉트
 */
export const PrivateRoute = ({ children }: PrivateRouteProps) => {
    const location = useLocation();
    const userRole = localStorage.getItem('userRole');

    // userRole이 없으면 로그인 페이지로 리다이렉트
    if (!userRole) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

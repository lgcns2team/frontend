export interface LoginRequest {
    nickname: string;
    password: string;
}

export interface LoginResponse {
    userId: string;
    nickname: string;
    name: string;
    role: 'TEACHER' | 'STUDENT';
    grade?: number;
    classroom?: number;
    teacherCode?: string;
    createdTeacherCode?: string;
    teacher_code?: number | string;
}

export interface SignupRequest {
    nickname: string;
    password: string;
    name: string;
    grade?: number;
    classroom?: number;
    role: 'TEACHER' | 'STUDENT';
    teacherCode?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const authApi = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await fetch(`${API_BASE_URL}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }


        const accessToken = response.headers.get('Authorization');
        const refreshToken = response.headers.get('Refresh-Token');

        console.log('🔍 Login Response Headers:');
        console.log('Authorization:', accessToken);
        console.log('Refresh-Token:', refreshToken);

        if (accessToken) {
            const pureToken = accessToken.replace('Bearer ', '');
            localStorage.setItem('accessToken', pureToken);
            console.log('✅ Token saved to localStorage');
        } else {
            console.warn('⚠️ No Authorization header in response!');
        }
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }

        const responseData = await response.json();

        // Store user info for frontend usage
        if (responseData.role) localStorage.setItem('userRole', responseData.role);
        if (responseData.name) localStorage.setItem('userName', responseData.name);
        if (responseData.nickname) localStorage.setItem('userNickname', responseData.nickname);
        if (responseData.userId) localStorage.setItem('userId', responseData.userId);

        if (responseData.grade) localStorage.setItem('userGrade', String(responseData.grade));
        if (responseData.classroom) localStorage.setItem('userClassroom', String(responseData.classroom));

        // Handle various possible field names from backend (camelCase, snake_case, etc.)
        const teacherCode = responseData.teacher_code || responseData.teacherCode || responseData.createdTeacherCode;
        if (teacherCode !== undefined && teacherCode !== null) {
            localStorage.setItem('teacher_code', String(teacherCode));
        }

        return responseData;
    },

    signup: async (data: SignupRequest): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/user/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Signup failed');
        }
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userNickname');
        localStorage.removeItem('userId');
        localStorage.removeItem('userGrade');
        localStorage.removeItem('userClassroom');
        localStorage.removeItem('teacher_code');

    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('accessToken');
    },

    getToken: (): string | null => {
        return localStorage.getItem('accessToken');
    }
};

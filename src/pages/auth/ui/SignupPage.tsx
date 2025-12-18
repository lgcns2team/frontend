import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { authApi } from '../../../shared/api/auth-api';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Link,
    CssBaseline,
    createTheme,
    ThemeProvider,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';

const claudeTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#DA7756', // Terracotta accent
        },
        background: {
            default: '#F9F9F7', // Warm off-white/beige from image
            paper: '#FFFFFF',
        },
        text: {
            primary: '#333333', // Dark charcoal
            secondary: '#666666',
        },
    },
    typography: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        h4: {
            fontFamily: '"Source Serif 4", "Merriweather", "Georgia", serif', // Serif headers
            color: '#333333',
            fontWeight: 500,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: '#C86545',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 24, // Rounded corners for card
                    boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.03)',
                    border: '1px solid #E5E5E5',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        backgroundColor: '#FFFFFF',
                        '& fieldset': {
                            borderColor: '#E0E0E0',
                        },
                        '&:hover fieldset': {
                            borderColor: '#DA7756',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#DA7756',
                        },
                    },
                },
            },
        },
    },
});

const SignupPage = () => {
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [classroom, setClassroom] = useState('');
    const [teacherCode, setTeacherCode] = useState('');
    const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRoleChange = (
        event: React.MouseEvent<HTMLElement>,
        newRole: 'STUDENT' | 'TEACHER' | null,
    ) => {
        if (newRole !== null) {
            setRole(newRole);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const signupData: any = {
                nickname,
                password,
                name,
                role
            };

            if (role === 'STUDENT') {
                signupData.grade = parseInt(grade);
                signupData.classroom = parseInt(classroom);
                signupData.teacherCode = parseInt(teacherCode);
            }

            await authApi.signup(signupData);
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            navigate('/');
        } catch (err: any) {
            console.error('Signup failed:', err);
            setError(err.message || '회원가입에 실패했습니다.');
        }
    };

    return (
        <ThemeProvider theme={claudeTheme}>
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    p: 2
                }}
            >
                <Container maxWidth="xs">
                    <Paper
                        elevation={0}
                        sx={{
                            p: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Typography component="h1" variant="h4" gutterBottom sx={{ mb: 1, textAlign: 'center' }}>
                            계정 만들기
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                            H.AI의 새로운 여정을 시작하세요
                        </Typography>

                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                <ToggleButtonGroup
                                    value={role}
                                    exclusive
                                    onChange={handleRoleChange}
                                    aria-label="role selection"
                                    fullWidth
                                >
                                    <ToggleButton value="STUDENT" sx={{ py: 1.5 }}>
                                        학생
                                    </ToggleButton>
                                    <ToggleButton value="TEACHER" sx={{ py: 1.5 }}>
                                        선생님
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            {role === 'STUDENT' && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="teacherCode"
                                    label="선생님 코드"
                                    name="teacherCode"
                                    value={teacherCode}
                                    onChange={(e) => setTeacherCode(e.target.value)}
                                    InputLabelProps={{ style: { color: '#888' } }}
                                    helperText="선생님께 전달받은 코드를 입력해주세요"
                                />
                            )}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="nickname"
                                label="아이디 (닉네임)"
                                name="nickname"
                                autoComplete="username"
                                autoFocus
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                InputLabelProps={{ style: { color: '#888' } }}
                                error={!!error}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="비밀번호"
                                type="password"
                                id="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputLabelProps={{ style: { color: '#888' } }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="name"
                                label="이름"
                                name="name"
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                InputLabelProps={{ style: { color: '#888' } }}
                            />
                            {role === 'STUDENT' && (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="grade"
                                        label="학년"
                                        name="grade"
                                        type="number"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        InputLabelProps={{ style: { color: '#888' } }}
                                    />
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="classroom"
                                        label="반"
                                        name="classroom"
                                        type="number"
                                        value={classroom}
                                        onChange={(e) => setClassroom(e.target.value)}
                                        InputLabelProps={{ style: { color: '#888' } }}
                                    />
                                </Box>
                            )}

                            {error && (
                                <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                                    {error}
                                </Typography>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                sx={{ mt: 4, mb: 3, py: 1.5, fontSize: '1rem', color: 'white' }}
                            >
                                가입하기
                            </Button>

                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    이미 계정이 있으신가요?{' '}
                                    <Link component={RouterLink} to="/" variant="body2" underline="hover" fontWeight="600" sx={{ color: '#DA7756' }}>
                                        로그인
                                    </Link>
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default SignupPage;

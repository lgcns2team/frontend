import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { authApi } from '../../../shared/api/auth-api';
import { colors } from '../../../shared/config/colors';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Checkbox,
    FormControlLabel,
    Link,
    CssBaseline,
    createTheme,
    ThemeProvider
} from '@mui/material';

const appTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: colors.main, // Deep Teal
            dark: colors.mainDark,
        },
        background: {
            default: colors.bgPrimary, // Warm cream
            paper: colors.bgWhite,
        },
        text: {
            primary: colors.textPrimary, // Near black
            secondary: colors.textSecondary,
        },
    },
    typography: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        h4: {
            fontFamily: '"Source Serif 4", "Merriweather", "Georgia", serif',
            color: colors.textPrimary,
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
                        backgroundColor: colors.mainDark,
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 24,
                    boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.03)',
                    border: `1px solid ${colors.borderLight}`,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        backgroundColor: colors.bgWhite,
                        '& fieldset': {
                            borderColor: colors.border,
                        },
                        '&:hover fieldset': {
                            borderColor: colors.secondary,
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: colors.main,
                        },
                    },
                },
            },
        },
    },
});

const LoginPage = () => {
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await authApi.login({ nickname, password });
            navigate('/map');
        } catch (err) {
            console.error('Login failed:', err);
            setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
        }
    };

    return (
        <ThemeProvider theme={appTheme}>
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
                            환영합니다
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                            H.AI를 계속 이용하시려면 로그인하세요
                        </Typography>

                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
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
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputLabelProps={{ style: { color: '#888' } }}
                                error={!!error}
                                helperText={error}
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            value="remember"
                                            sx={{
                                                color: colors.border,
                                                '&.Mui-checked': {
                                                    color: colors.accent,
                                                },
                                            }}
                                        />
                                    }
                                    label={<Typography variant="body2" color="text.secondary">로그인 상태 유지</Typography>}
                                />
                                <Link href="#" variant="body2" underline="hover" sx={{ color: colors.accent }}>
                                    비밀번호 찾기
                                </Link>
                            </Box>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                sx={{ mt: 2, mb: 3, py: 1.5, fontSize: '1rem', color: 'white' }}
                            >
                                계속하기
                            </Button>

                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    계정이 없으신가요?{' '}
                                    <Link component={RouterLink} to="/signup" variant="body2" underline="hover" fontWeight="600" sx={{ color: colors.accent }}>
                                        회원가입
                                    </Link>
                                </Typography>
                            </Box>

                            <Button
                                fullWidth
                                variant="outlined"
                                size="large"
                                sx={{
                                    mt: 2,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    borderColor: colors.secondary,
                                    color: colors.main,
                                    '&:hover': {
                                        borderColor: colors.main,
                                        backgroundColor: `${colors.secondary}10`,
                                    },
                                }}
                                onClick={() => {
                                    localStorage.setItem('userRole', 'GUEST');
                                    localStorage.setItem('userName', '게스트');
                                    navigate('/map');
                                }}
                            >
                                게스트 로그인
                            </Button>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default LoginPage;

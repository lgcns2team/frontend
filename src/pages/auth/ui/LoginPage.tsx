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
    Checkbox,
    FormControlLabel,
    Link,
    CssBaseline,
    createTheme,
    ThemeProvider
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
                                                color: '#D1D1D1',
                                                '&.Mui-checked': {
                                                    color: '#DA7756',
                                                },
                                            }}
                                        />
                                    }
                                    label={<Typography variant="body2" color="text.secondary">로그인 상태 유지</Typography>}
                                />
                                <Link href="#" variant="body2" underline="hover" sx={{ color: '#DA7756' }}>
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
                                    <Link component={RouterLink} to="/signup" variant="body2" underline="hover" fontWeight="600" sx={{ color: '#DA7756' }}>
                                        회원가입
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

export default LoginPage;

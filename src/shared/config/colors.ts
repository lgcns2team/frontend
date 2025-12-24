/**
 * Shared Color Constants for H.AI Application
 * 
 * Use these constants in MUI themes and JavaScript/TypeScript files.
 * CSS files should use the corresponding CSS variables defined in index.css.
 */

export const colors = {
    // Brand Colors
    main: '#496b6e',
    mainDark: '#3a5759',
    mainLight: '#5a7c7f',

    secondary: '#88a09b',
    secondaryDark: '#768e89',
    secondaryLight: '#a3b8b4',

    accent: '#c49f64',
    accentDark: '#b08d54',
    accentLight: '#d4b47e',

    // Background Colors
    bgPrimary: '#f9f7f1',
    bgSecondary: '#f4f1ea',
    bgTertiary: '#edeae3',
    bgWhite: '#ffffff',

    // Text Colors
    textPrimary: '#040316',
    textSecondary: '#3d3d4a',
    textMuted: '#6b6b7a',
    textOnMain: '#ffffff',

    // Utility Colors
    border: '#d4d1ca',
    borderLight: '#e5e2db',

    // Status Colors (kept standard for UX)
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
} as const;

export type ColorKey = keyof typeof colors;

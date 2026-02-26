// Tema de colores inspirado en Metro Bilbao
export const COLORS = {
    // Colores principales del Metro de Bilbao
    primary: '#E31937', // Rojo Metro Bilbao
    primaryDark: '#B81430',
    primaryLight: '#FF3D55',

    // Fondos
    background: '#1A1A2E', // Fondo oscuro premium
    surface: '#16213E', // Superficie elevada
    surfaceLight: '#1F3050', // Superficie más clara
    card: '#0F3460', // Cards

    // Textos
    textPrimary: '#FFFFFF',
    textSecondary: '#A0AEC0',
    textMuted: '#718096',

    // Líneas del metro
    line1: '#E31937', // L1 - Rojo
    line2: '#E31937', // L2 - Rojo
    line3: '#00A650', // L3 - Verde

    // Acentos
    accent: '#00B4D8',
    accentGold: '#FFD700',
    success: '#48BB78',
    warning: '#F6AD55',
    error: '#FC8181',

    // Widget
    widgetBg: '#1A1A2E',
    widgetCard: '#16213E',
    widgetBorder: 'rgba(255,255,255,0.08)',

    // Gradientes (start, end)
    gradientPrimary: ['#E31937', '#B81430'],
    gradientDark: ['#1A1A2E', '#16213E'],
    gradientCard: ['#0F3460', '#16213E'],
};

export const FONTS = {
    regular: 'System',
    bold: 'System',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 50,
};

export const SHADOWS = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
};

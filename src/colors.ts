export const Colors = {
  primary: {
    orange: '#FF6B35',
    darkOrange: '#E55A2B',
    lightOrange: '#FF8A65',
  },
  secondary: {
    teal: '#00BFA6',
    darkTeal: '#00A693',
    lightTeal: '#26C6DA',
  },
  neutral: {
    white: '#FFFFFF',
    lightGray: '#F8F9FA',
    mediumGray: '#E9ECEF',
    darkGray: '#6C757D',
    charcoal: '#343A40',
    black: '#212529',
  },
  text: {
    primary: '#212529',
    secondary: '#6C757D',
    light: '#ADB5BD',
    inverse: '#FFFFFF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#E9ECEF',
  },
  status: {
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
  },
  player: {
    progressBar: '#FF6B35',
    progressBackground: '#E9ECEF',
    controlActive: '#FF6B35',
    controlInactive: '#6C757D',
    timeText: '#343A40',
  },
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.15)',
    dark: 'rgba(0, 0, 0, 0.25)',
  },
} as const;

export type ColorKeys = keyof typeof Colors;

export const Colors = {
  background: {
    primary: '#1A1A1A',
    secondary: '#2A2A2A',
    card: '#2C2C2E',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#8E8E93',
    tertiary: '#6D6D70',
    inverse: '#1A1A1A',
  },
  primary: {
    orange: '#007AFF',
    blue: '#32ADE6',
  },
  neutral: {
    lightGray: '#48484A',
    mediumGray: '#3A3A3C',
    darkGray: '#2C2C2E',
  },
  status: {
    error: '#FF453A',
    success: '#30D158',
  },
  shadow: {
    light: '#000000',
  }
};

export type ColorKeys = keyof typeof Colors;

export const theme = {
  colors: {
    background: '#1A1A1A',
    surface: '#2A2A2A', 
    primary: '#FFFFFF',
    secondary: '#A0A0A0',
    accent: '#007AFF',
    border: '#3A3A3A'
  },
  typography: {
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: '#FFFFFF'
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '400', 
      color: '#A0A0A0'
    },
    body: {
      fontSize: 14,
      fontWeight: '400',
      color: '#FFFFFF'
    }
  }
}

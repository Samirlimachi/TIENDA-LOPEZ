import { scaleFontSize } from '@constants/dimensions';

// Paleta oficial de marca Lopez.
export const Colors = {
  primary: '#1A2B49', // Azul Marino Principal
  primaryDark: '#101B30',
  secondary: '#ED968D', // Rosa Coral
  peach: '#EEDFD8', // Melocotón Suave
  linen: '#C7AE8E', // Lino Textil
  brown: '#A39478', // Marrón Suave de la Cuerda
  background: '#FFFFFF',
  surface: '#EEDFD8',
  text: '#1A2B49',
  textMuted: '#7C8798',
  border: '#DFE3E6', // Gris Suave de la Bolsa
  success: '#2E7D32',
  danger: '#C62828',
  white: '#FFFFFF',
  black: '#000000',
};

export const Typography = {
  h1: { fontSize: scaleFontSize(28), fontWeight: '700' as const },
  h2: { fontSize: scaleFontSize(22), fontWeight: '700' as const },
  h3: { fontSize: scaleFontSize(18), fontWeight: '600' as const },
  body: { fontSize: scaleFontSize(14), fontWeight: '400' as const },
  caption: { fontSize: scaleFontSize(12), fontWeight: '400' as const },
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
};

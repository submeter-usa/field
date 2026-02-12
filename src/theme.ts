'use client';

import { createTheme } from '@mui/material/styles';
import { Public_Sans } from 'next/font/google';

const primaryFont = Public_Sans({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
});

declare module '@mui/material/styles' {
  interface Palette {
    neutral?: {
      main?: string;
    };
  }
  interface PaletteOptions {
    neutral?: {
      main?: string;
    };
  }
  interface TypeBackground {
    neutral?: string;
  }
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    neutral: {
      main: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: primaryFont.style.fontFamily, // ✅ Changed here
  },
});

// Extend background to include neutral color
declare module '@mui/material/styles' {
  interface Theme {
    bgColor?: {
      neutral?: string;
    };
  }
  interface ThemeOptions {
    bgColor?: {
      neutral?: string;
    };
  }
}

export default theme;
export { primaryFont };
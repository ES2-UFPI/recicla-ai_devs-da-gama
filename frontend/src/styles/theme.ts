import { createTheme } from '@mui/material/styles';

// Psicologia das cores para reciclagem:
// Verde: sustentabilidade, natureza, renovação
// Azul: confiança, tecnologia limpa
// Marrom/terroso: conexão com o natural
// Amarelo: energia, otimismo (detalhes)

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#388e3c', // Verde reciclável (natureza, eco-friendly)
      light: '#66bb6a',
      dark: '#1b5e20',
      contrastText: '#fff',
    },
    secondary: {
      main: '#1976d2', // Azul (confiança, tecnologia limpa)
      light: '#63a4ff',
      dark: '#004ba0',
      contrastText: '#fff',
    },
    success: {
      main: '#8bc34a', // Verde claro (crescimento, renovação)
      light: '#c5e1a5',
      dark: '#558b2f',
      contrastText: '#fff',
    },
    warning: {
      main: '#fbc02d', // Amarelo (energia, alerta para reciclar)
      light: '#fff263',
      dark: '#c49000',
      contrastText: '#333',
    },
    background: {
      default: '#f1f8e9', // Verde muito claro (fundo suave, eco)
      paper: '#ffffff',
    },
    info: {
      main: '#a1887f', // Marrom claro (elemento terroso)
      light: '#d7ccc8',
      dark: '#6d4c41',
      contrastText: '#fff',
    },
    text: {
      primary: '#263238', // Cinza escuro (legibilidade)
      secondary: '#388e3c', // Verde principal para destaques
    },
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
  },
});
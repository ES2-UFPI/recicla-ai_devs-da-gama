import { Global, css } from '@emotion/react';
import { useTheme } from '@mui/material/styles';

/**
 * GlobalStyles: estilos globais modernos e responsivos para site de reciclagem
 * Compatível com o theme.ts (cores, fontes, background)
 * Inclui reset, responsividade e UX aprimorada
 */
export function GlobalStyles() {
  const theme = useTheme();
  
  return (
    <Global
      styles={css`
        /* Reset CSS moderno */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          height: 100%;
          font-size: 16px;
          scroll-behavior: smooth;
          background: ${theme.palette.background.default};
        }

        body {
          min-height: 100vh;
          width: 100vw;
          font-family: ${theme.typography.fontFamily};
          color: ${theme.palette.text.primary};
          background: ${theme.palette.background.default};
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }

        #root {
          min-height: 100vh;
          width: 100%;
        }

        a {
          color: ${theme.palette.primary.main};
          text-decoration: none;
          transition: color 0.2s;
        }

        a:hover, a:focus {
          color: ${theme.palette.secondary.main};
          text-decoration: underline;
        }

        button, input, select, textarea {
          font-family: inherit;
          font-size: 1rem;
        }

        img, svg {
          max-width: 100%;
          display: block;
        }

        /* Responsividade: ajusta base do html para mobile/tablet/web */
        @media (max-width: 600px) {
          html { font-size: 15px; }
        }

        @media (min-width: 601px) and (max-width: 900px) {
          html { font-size: 16px; }
        }

        @media (min-width: 901px) {
          html { font-size: 17px; }
        }

        /* Scrollbar customizada (webkit) */
        ::-webkit-scrollbar {
          width: 10px;
          background: ${theme.palette.background.default};
        }

        ::-webkit-scrollbar-thumb {
          background: ${theme.palette.primary.light};
          border-radius: 8px;
        }

        /* Seleção de texto com cor do tema */
        ::selection {
          background: ${theme.palette.primary.light};
          color: #fff;
        }

        /* Acessibilidade: foco visível */
        :focus-visible {
          outline: 2px solid ${theme.palette.secondary.main};
          outline-offset: 2px;
        }
      `}
    />
  );
}
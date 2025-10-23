import { Box, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import RecyclingIcon from '@mui/icons-material/Recycling';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.success.light} 100%)`,
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '35rem' }}>
        <Paper
          elevation={4}
          sx={{
            padding: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            borderRadius: '1rem',
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0 0.5rem 2rem rgba(56, 142, 60, 0.15)',
            width: '100%',
          }}
        >
          {/* Cabeçalho com Logo/Ícone */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            {/* Ícone de Reciclagem */}
            <Box
              sx={{
            width: '4.5rem',
            height: '4.5rem',
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: `0 0.25rem 0.75rem ${theme.palette.primary.light}40`,
              }}
            >
              <RecyclingIcon
            sx={{
              fontSize: '2.5rem',
              color: theme.palette.primary.contrastText,
            }}
              />
            </Box>

            {/* Título */}
            {title && (
              <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              textAlign: 'center',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
              >
            {title}
              </Typography>
            )}

            {/* Subtítulo */}
            {subtitle && (
              <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              textAlign: 'center',
              marginTop: '0.5rem',
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
              >
            {subtitle}
              </Typography>
            )}
          </Box>

          {/* Conteúdo (Formulário de Login/Register) */}
          <Box sx={{ marginTop: '1rem' }}>
            {children}
          </Box>
        </Paper>

        {/* Rodapé (opcional) */}
        <Box
          sx={{
            marginTop: '1.5rem',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              opacity: 0.8,
              fontSize: '0.75rem',
            }}
          >
            ReciclaAi - Devs da Gama © 2025
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
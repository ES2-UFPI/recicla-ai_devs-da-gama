import { Container, Box, Typography, Button, useTheme } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Container
      maxWidth="lg"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        py: 3,
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {/* Ícone grande */}
        <ErrorOutlineIcon
          sx={{
            fontSize: '8rem',
            color: theme.palette.error.main,
            opacity: 0.8,
          }}
        />

        {/* Código de erro */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '3rem', md: '5rem' },
            fontWeight: 700,
            color: theme.palette.primary.main,
            m: 0,
          }}
        >
          404
        </Typography>

        {/* Título */}
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Página não encontrada
        </Typography>

        {/* Descrição */}
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: '1rem', md: '1.1rem' },
            color: theme.palette.text.secondary,
            maxWidth: '500px',
            mb: 2,
          }}
        >
          Desculpe, a página que você está procurando não existe ou foi movida. 
          Volte para a página inicial e continue explorando a plataforma.
        </Typography>

        {/* Botão */}
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate('/')}
          sx={{
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[8],
            },
            transition: 'all 0.3s ease',
          }}
        >
          Voltar para Home
        </Button>
      </Box>
    </Container>
  );
}

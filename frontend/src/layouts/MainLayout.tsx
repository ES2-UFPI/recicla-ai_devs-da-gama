import { Box, Container } from '@mui/material';
import { Navbar } from '../components/Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export function MainLayout({ children, maxWidth = 'lg' }: MainLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Navbar />
      
      <Container
        maxWidth={maxWidth}
        component="main"
        sx={{
          flex: 1,
          py: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          px: { xs: '1rem', sm: '1.5rem', md: '2rem' },
        }}
      >
        {children}
      </Container>

      {/* Footer (opcional) */}
      <Box
        component="footer"
        sx={{
          py: '1.5rem',
          textAlign: 'center',
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
          color: 'text.secondary',
          fontSize: '0.875rem',
        }}
      >
        ReciclaAi - Devs da Gama © 2025
      </Box>
    </Box>
  );
}
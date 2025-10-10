import { MainLayout } from '../../layouts/MainLayout';
import { Typography, Box } from '@mui/material';

export default function Residuo() {
  return (
    <MainLayout>
      <Box sx={{ textAlign: 'center', mt: { xs: 2, md: 6 } }}>
        <Typography variant="h3" fontWeight={700} color="primary.main" gutterBottom>
          Gerenciamento de Resíduos
        </Typography>
      </Box>
    </MainLayout>
  );
}

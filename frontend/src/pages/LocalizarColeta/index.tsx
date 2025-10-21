import { Navbar } from '../../components/Navbar';
import { GlobalStyles } from '../../styles/GlobalStyles';
import { Box, Typography } from '@mui/material';

export default function LocalizarColeta() {
  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Box sx={{ mt: 4, px: 2, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h4" color="primary" fontWeight={700} mb={2}>
          Localizar Coleta
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Encontre resíduos disponíveis para coleta próximos a você.
        </Typography>
        {/* Aqui vai o mapa futuramente */}
        <Box sx={{ border: '2px dashed #bbb', borderRadius: 2, p: 4, color: 'text.disabled', fontSize: 18 }}>
          [Mapa de resíduos em breve]
        </Box>
      </Box>
    </>
  );
}

import { Box, Typography, Button } from '@mui/material';
import { Navbar } from '../../components/Navbar';
import { GlobalStyles } from '../../styles/GlobalStyles';
import { Link as RouterLink } from 'react-router-dom';

export default function Coleta() {
  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Box sx={{ mt: 4, px: 2, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h4" color="primary" fontWeight={700} mb={2}>
          Minhas Coletas
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Visualize e gerencie suas coletas em andamento e concluídas.
        </Typography>
        <Button
          component={RouterLink}
          to="/localizar-coleta"
          variant="contained"
          color="primary"
          sx={{ mb: 4, borderRadius: 2, fontWeight: 600 }}
        >
          Localizar Resíduos para Coletar
        </Button>
        {/* Aqui futuramente: cards/lista de coletas */}
        <Box sx={{ border: '2px dashed #bbb', borderRadius: 2, p: 4, color: 'text.disabled', fontSize: 18 }}>
          [Lista de coletas em breve]
        </Box>
      </Box>
    </>
  );
}

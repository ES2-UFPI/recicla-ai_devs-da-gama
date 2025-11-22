import { Box, Typography } from '@mui/material';
import RecyclingIcon from '@mui/icons-material/Recycling';

export function SuccessMessage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box
        sx={{
          p: 3,
          bgcolor: 'success.light',
          borderRadius: '0.75rem',
          textAlign: 'center',
          maxWidth: '800px',
          width: '100%',
        }}
      >
        <RecyclingIcon
          sx={{
            fontSize: '3rem',
            color: 'success.dark',
            mb: 2,
          }}
        />
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: 'success.dark' }}>
          Parabéns pela sua contribuição! 🌱
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Cada resíduo reciclado faz a diferença para um planeta mais sustentável. 
          Continue contribuindo para a preservação do meio ambiente!
        </Typography>
      </Box>
    </Box>
  );
}

import { Card, CardContent, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';

export function EmptyState() {
  const navigate = useNavigate();

  return (
    <Card sx={{ borderRadius: '0.75rem' }}>
      <CardContent sx={{ textAlign: 'center', py: 6 }}>
        <HistoryIcon
          sx={{
            fontSize: '4rem',
            color: 'text.secondary',
            opacity: 0.5,
            mb: 2,
          }}
        />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Nenhum resgate encontrado
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Você ainda não resgatou nenhuma recompensa. Visite a loja de recompensas para começar!
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/recompensas')}
        >
          Ver Recompensas Disponíveis
        </Button>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, Typography } from '@mui/material';
import RecyclingIcon from '@mui/icons-material/Recycling';

interface EmptyStateProps {
  userRole?: string;
}

export function EmptyState({ userRole }: EmptyStateProps) {
  return (
    <Card
      sx={{
        borderRadius: '0.75rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        py: 6,
      }}
    >
      <CardContent>
        <RecyclingIcon
          sx={{
            fontSize: '4rem',
            color: 'text.secondary',
            mb: 2,
          }}
        />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Nenhum dado disponível
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {userRole === 'produtor' 
            ? 'Seus resíduos coletados ou entregues aparecerão aqui.'
            : 'Os resíduos recebidos em suas entregas aparecerão aqui.'}
        </Typography>
      </CardContent>
    </Card>
  );
}

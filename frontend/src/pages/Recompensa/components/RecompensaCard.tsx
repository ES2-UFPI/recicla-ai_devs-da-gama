import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Typography,
  Stack,
  Box,
} from '@mui/material';
import StarsIcon from '@mui/icons-material/Stars';
import { tipoIcons } from '../icons';
import { tipoLabels } from '../constants';
import type { Recompensa } from '../../../services/recompensaService';

interface RecompensaCardProps {
  recompensa: Recompensa;
  imageUrl: string;
  onImageError: (id: string) => void;
  podResgatar: boolean;
  onVerDetalhes: () => void;
}

export function RecompensaCard({
  recompensa,
  imageUrl,
  onImageError,
  podResgatar,
  onVerDetalhes,
}: RecompensaCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '0.75rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={imageUrl}
        alt={recompensa.nome}
        onError={() => onImageError(recompensa.id)}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip
            icon={tipoIcons[recompensa.tipo]}
            label={tipoLabels[recompensa.tipo]}
            size="small"
            color="primary"
            variant="outlined"
          />
          {recompensa.estoque < 10 && (
            <Chip
              label={`${recompensa.estoque} restantes`}
              size="small"
              color="warning"
            />
          )}
        </Stack>

        <Typography
          variant="h6"
          fontWeight={600}
          sx={{
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {recompensa.nome}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            flex: 1,
          }}
        >
          {recompensa.descricao}
        </Typography>

        {recompensa.parceiro && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Patrocinador:</strong> {recompensa.parceiro}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            bgcolor: podResgatar ? 'success.50' : 'grey.100',
            borderRadius: '0.5rem',
            mb: 2,
          }}
        >
          <StarsIcon color={podResgatar ? 'success' : 'disabled'} />
          <Typography
            variant="h6"
            fontWeight={700}
            color={podResgatar ? 'success.main' : 'text.disabled'}
          >
            {recompensa.pontos_necessarios.toLocaleString('pt-BR')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            pontos
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={onVerDetalhes}
          sx={{
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Ver Detalhes
        </Button>
      </CardActions>
    </Card>
  );
}

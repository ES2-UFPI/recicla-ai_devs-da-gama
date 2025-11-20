import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import StarsIcon from '@mui/icons-material/Stars';
import { tipoIcons } from '../icons';
import { tipoLabels } from '../constants';
import type { Recompensa } from '../../../services/recompensaService';

interface RecompensaDetailModalProps {
  recompensa: Recompensa | null;
  open: boolean;
  onClose: () => void;
  getImageUrl: (recompensa: Recompensa) => string;
  onImageError: (id: string) => void;
}

export function RecompensaDetailModal({
  recompensa,
  open,
  onClose,
  getImageUrl,
  onImageError,
}: RecompensaDetailModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!recompensa) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '1rem',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Grid container>
          {/* Imagem */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              component="img"
              src={getImageUrl(recompensa)}
              alt={recompensa.nome}
              onError={() => onImageError(recompensa.id)}
              sx={{
                width: '100%',
                height: { xs: 250, md: '100%' },
                objectFit: 'cover',
              }}
            />
          </Grid>

          {/* Detalhes */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip
                  icon={tipoIcons[recompensa.tipo]}
                  label={tipoLabels[recompensa.tipo]}
                  color="primary"
                />
                {recompensa.estoque < 10 && (
                  <Chip
                    label={`Apenas ${recompensa.estoque} disponíveis`}
                    color="warning"
                  />
                )}
              </Stack>

              <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                {recompensa.nome}
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {recompensa.descricao}
              </Typography>

              {recompensa.parceiro && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Patrocinado por:</strong> {recompensa.parceiro}
                  </Typography>
                </Box>
              )}

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: '0.75rem',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <StarsIcon color="primary" />
                  <Typography variant="h5" fontWeight={700}>
                    {recompensa.pontos_necessarios.toLocaleString('pt-BR')} pontos
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Valor da recompensa
                </Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

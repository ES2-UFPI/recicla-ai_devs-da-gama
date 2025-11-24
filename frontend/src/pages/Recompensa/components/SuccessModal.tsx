import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import RedeemIcon from '@mui/icons-material/Redeem';
import StarsIcon from '@mui/icons-material/Stars';
import type { ResgateInfo } from '../types';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  resgateInfo: ResgateInfo | null;
  userPoints: number;
}

export function SuccessModal({
  open,
  onClose,
  resgateInfo,
  userPoints,
}: SuccessModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '1rem',
          textAlign: 'center',
        },
      }}
    >
      <DialogContent sx={{ py: 4 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'success.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <RedeemIcon sx={{ fontSize: '3rem', color: 'white' }} />
        </Box>

        <Typography variant="h4" fontWeight={700} color="success.main" sx={{ mb: 2 }}>
          Resgate Realizado!
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Parabéns! Você resgatou com sucesso:
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: '0.75rem',
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            {resgateInfo?.nome}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <StarsIcon color="warning" />
            <Typography variant="body1" color="text.secondary">
              <strong>{resgateInfo?.pontos.toLocaleString('pt-BR')}</strong> pontos gastos
            </Typography>
          </Box>
        </Paper>

        <Box
          sx={{
            p: 2,
            bgcolor: 'primary.50',
            borderRadius: '0.75rem',
            mb: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Seu novo saldo
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <StarsIcon color="primary" sx={{ fontSize: '1.5rem' }} />
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {userPoints.toLocaleString('pt-BR')} pontos
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Continue reciclando para ganhar mais pontos e resgatar novas recompensas!
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center' }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
          }}
        >
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

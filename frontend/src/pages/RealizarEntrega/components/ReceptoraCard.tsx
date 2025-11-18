/**
 * Componente para exibir informações da receptora
 */

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import RecyclingIcon from '@mui/icons-material/Recycling';
import type { ReceptoraInfo } from '../types';

interface ReceptoraCardProps {
  receptora: ReceptoraInfo;
  materiaisNomes: string[]; // Nomes das categorias aceitas
}

export const ReceptoraCard = ({ receptora, materiaisNomes }: ReceptoraCardProps) => {
  const enderecoPrincipal = receptora.addresses?.[0];

  return (
    <Card 
      elevation={3}
      sx={{
        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        color: 'white',
        mb: 3,
      }}
    >
      <CardContent>
        {/* Nome da Receptora */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <RecyclingIcon sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700}>
            {receptora.name}
          </Typography>
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', my: 2 }} />

        {/* Informações de Contato */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {enderecoPrincipal && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <LocationOnIcon fontSize="small" />
              <Box>
                <Typography variant="body2">
                  {enderecoPrincipal.logradouro}, {enderecoPrincipal.numero}
                </Typography>
                {enderecoPrincipal.complemento && (
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {enderecoPrincipal.complemento}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  CEP: {enderecoPrincipal.cep}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon fontSize="small" />
            <Typography variant="body2">{receptora.email}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon fontSize="small" />
            <Typography variant="body2">{receptora.phone || 'Não informado'}</Typography>
          </Box>
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', my: 2 }} />

        {/* Materiais Aceitos */}
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.9, mb: 1, display: 'block' }}>
            Materiais aceitos:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {materiaisNomes.length > 0 ? (
              materiaisNomes.map((material, index) => (
                <Chip
                  key={index}
                  label={material}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                />
              ))
            ) : (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Nenhum material especificado
              </Typography>
            )}
          </Box>
        </Box>

        {/* Distância (se disponível) */}
        {receptora.distancia_km !== undefined && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.3)' }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              📍 Distância: <strong>{receptora.distancia_km.toFixed(1)} km</strong>
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

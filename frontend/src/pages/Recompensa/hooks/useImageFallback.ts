import { useState, useCallback } from 'react';
import { FALLBACK_IMAGE } from '../constants';
import type { Recompensa } from '../../../services/recompensaService';

export function useImageFallback() {
  const [imagensComErro, setImagensComErro] = useState<Set<string>>(new Set());

  const handleImageError = useCallback((recompensaId: string) => {
    setImagensComErro((prev) => new Set(prev).add(recompensaId));
  }, []);

  const getImageUrl = useCallback((recompensa: Recompensa) => {
    if (imagensComErro.has(recompensa.id) || !recompensa.foto_url) {
      return FALLBACK_IMAGE;
    }
    return recompensa.foto_url;
  }, [imagensComErro]);

  return {
    handleImageError,
    getImageUrl,
  };
}

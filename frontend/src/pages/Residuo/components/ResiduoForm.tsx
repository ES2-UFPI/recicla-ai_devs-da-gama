import { useEffect, useState } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import type { Categoria, UnidadeMedida } from '../../../types/residuo';
import { unidades } from '../constants';
import type { ResiduoCreateInput } from '../types';

type Props = {
  categorias: Categoria[];
  onSubmit: (data: ResiduoCreateInput) => Promise<void> | void;
};

export function ResiduoForm({ categorias, onSubmit }: Props) {
  const [quantidade, setQuantidade] = useState<string>('');
  const [unidade, setUnidade] = useState<UnidadeMedida>('kg');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  const handleFileChange = (file: File | null) => {
    setFotoError(null);
    setFotoFile(null);
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(null);
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      setFotoError('Formato inválido. Envie PNG ou JPG.');
      return;
    }
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setFotoError(`Arquivo muito grande. Máximo ${maxSizeMB}MB.`);
      return;
    }
    setFotoFile(file);
    const url = URL.createObjectURL(file);
    setFotoPreview(url);
  };

  const resetForm = () => {
    setQuantidade('');
    setUnidade('kg');
    setCategoriaId('');
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(null);
    setFotoFile(null);
    setFotoError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantidade || !categoriaId) return;
    if (!fotoFile) {
      setFotoError('A foto é obrigatória.');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({
        quantidade: Number(quantidade),
        unidade,
        categoriaId,
        foto: fotoFile,
      });
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
        <TextField
          label="Quantidade"
          type="number"
          slotProps={{ input: { inputProps: { step: 0.01, min: 0, inputMode: 'decimal' } } }}
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          required
          fullWidth
        />
        <FormControl fullWidth>
          <InputLabel id="unidade-label">Unidade</InputLabel>
          <Select labelId="unidade-label" label="Unidade" value={unidade} onChange={(e) => setUnidade(e.target.value as UnidadeMedida)}>
            {unidades.map((u) => (
              <MenuItem key={u} value={u}>
                {u}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="categoria-label">Categoria</InputLabel>
          <Select labelId="categoria-label" label="Categoria" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value as string)} required>
            {categorias.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'stretch', alignItems: 'stretch', width: { xs: '100%', sm: '100%' }, maxWidth: { xs: 'none', sm: 220 } }}>
          <Button
            variant="outlined"
            component="label"
            sx={{
              textTransform: 'none',
              height: { xs: '56px', sm: '56px' },
              minHeight: { xs: '56px', sm: '56px' },
              width: { xs: '100%', sm: '100%' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Selecionar Foto (PNG, JPG)
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              hidden
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </Button>
          {fotoError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, textAlign: 'center' }}>
              {fotoError}
            </Typography>
          )}
          {fotoPreview && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <img src={fotoPreview} alt="Pré-visualização" style={{ maxWidth: 160, borderRadius: 8, border: '1px solid #eee' }} />
            </Box>
          )}
        </Box>
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={submitting}
          sx={{
            fontWeight: 600,
            minWidth: { xs: 0, sm: 120 },
            width: { xs: '100%', sm: 'auto' },
            height: { xs: '56px', sm: 'auto' },
          }}
        >
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </Box>
    </Box>
  );
}

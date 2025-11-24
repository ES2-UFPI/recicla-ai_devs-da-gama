import { Box, FormControl, Typography, FormHelperText, CircularProgress, Checkbox } from '@mui/material';
import type { Categoria } from '../../../types/categoria';
import { categoriaColor } from '../../../utils/categoriaColor';

type Props = {
  categorias: Categoria[];
  selected: string[]; // Nomes das categorias (ex: "Plástico", "Vidro")
  onChange: (next: string[]) => void;
  loading?: boolean;
  required?: boolean;
  label?: string;
  helperText?: string;
};

function getCategoriaColor(tipo: string): string {
  const key = tipo.toLowerCase();
  const normalized = key.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return categoriaColor[key] ?? categoriaColor[normalized] ?? '#bdbdbd';
}

function getContrastColor(bgColor: string): string {
  // Converte hex para RGB e calcula luminância
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminância = (r * 299 + g * 587 + b * 114) / 1000;
  return luminância > 128 ? '#000000' : '#ffffff';
}

export function CategoriaCheckboxList({ categorias, selected, onChange, loading, required, label, helperText }: Props) {
  const hasError = !!required && selected.length === 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2">Carregando categorias...</Typography>
      </Box>
    );
  }

  return (
    <FormControl component="fieldset" fullWidth required={required} error={hasError}>
      {label && (
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {label}
        </Typography>
      )}

      {helperText && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {helperText}
        </Typography>
      )}

      {/* Tags coloridas dos materiais selecionados */}
      {selected.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {selected.map((tipo) => {
            const color = getCategoriaColor(tipo);
            const textColor = getContrastColor(color);
            return (
              <Box
                key={tipo}
                sx={{
                  bgcolor: color,
                  color: textColor,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {tipo}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Lista de checkboxes simples */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {categorias.map((categoria) => {
          const isChecked = selected.includes(categoria.tipo);
          return (
            <Box
              key={categoria.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1,
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
              onClick={() => {
                onChange(
                  isChecked
                    ? selected.filter((t) => t !== categoria.tipo)
                    : [...selected, categoria.tipo]
                );
              }}
              role="button"
              tabIndex={0}
            >
              <Checkbox
                checked={isChecked}
                onChange={() => {
                  onChange(
                    isChecked
                      ? selected.filter((t) => t !== categoria.tipo)
                      : [...selected, categoria.tipo]
                  );
                }}
                size="medium"
                sx={{ p: 0 }}
              />
              <Typography variant="body2">{categoria.tipo}</Typography>
            </Box>
          );
        })}
      </Box>

      {hasError && (
        <FormHelperText sx={{ mt: 1 }}>Selecione pelo menos um tipo de material</FormHelperText>
      )}
    </FormControl>
  );
}

import { useState } from 'react';
import {
  Box,
  Button,
  Slider,
  Typography,
  Collapse,
  IconButton,
  Paper,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface SearchFiltersProps {
  raio: number;
  onRaioChange: (value: number) => void;
  onSearch: () => void;
  loading: boolean;
}

export function SearchFilters({
  raio,
  onRaioChange,
  onSearch,
  loading,
}: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      {/* Header com botão expandir */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: expanded ? 2 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Filtros de Busca
          </Typography>
        </Box>
        <IconButton onClick={() => setExpanded(!expanded)} size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Raio de busca */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Raio de busca: {raio} km
            </Typography>
            <Slider
              value={raio}
              onChange={(_, value) => onRaioChange(value as number)}
              min={1}
              max={50}
              step={1}
              marks={[
                { value: 1, label: '1km' },
                { value: 10, label: '10km' },
                { value: 25, label: '25km' },
                { value: 50, label: '50km' },
              ]}
              valueLabelDisplay="auto"
              color="primary"
            />
          </Box>

          {/* Botão de busca */}
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={onSearch}
            disabled={loading}
            fullWidth
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {loading ? 'Buscando...' : 'Buscar Agendamentos'}
          </Button>
        </Box>
      </Collapse>

      {/* Botão compacto quando fechado */}
      {!expanded && (
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={onSearch}
          disabled={loading}
          fullWidth
          sx={{ borderRadius: 2, fontWeight: 600, mt: 2 }}
        >
          {loading ? 'Buscando...' : 'Buscar Agendamentos'}
        </Button>
      )}
    </Paper>
  );
}

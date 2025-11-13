import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Stack,
  Collapse,
  IconButton,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ClearIcon from '@mui/icons-material/Clear';
import { useCategorias } from '../../LocalizarColeta/hooks/useCategorias';

interface SearchFiltersProps {
  raio: number;
  onRaioChange: (raio: number) => void;
  categoriasSelected: string[];
  onCategoriasChange: (categorias: string[]) => void;
  onSearch: () => void;
  loading: boolean;
}

export function SearchFilters({
  raio,
  onRaioChange,
  categoriasSelected,
  onCategoriasChange,
  onSearch,
  loading,
}: SearchFiltersProps) {
  const { categorias } = useCategorias();
  const [localRaio, setLocalRaio] = useState(raio);

  // Atualiza raio local quando prop muda
  useEffect(() => {
    setLocalRaio(raio);
  }, [raio]);

  const handleRaioChange = (_event: Event, value: number | number[]) => {
    const newRaio = value as number;
    setLocalRaio(newRaio);
  };

  const handleRaioCommit = (_event: Event | React.SyntheticEvent, value: number | number[]) => {
    const newRaio = value as number;
    onRaioChange(newRaio);
  };

  const handleCategoriaToggle = (categoriaId: string) => {
    const isSelected = categoriasSelected.includes(categoriaId);
    
    if (isSelected) {
      onCategoriasChange(categoriasSelected.filter(id => id !== categoriaId));
    } else {
      onCategoriasChange([...categoriasSelected, categoriaId]);
    }
  };

  const handleClearFilters = () => {
    onCategoriasChange([]);
    onRaioChange(5);
    setLocalRaio(5);
  };

  const categoriasArray = Array.from(categorias.values());
  const hasFilters = categoriasSelected.length > 0 || raio !== 5;
  const [showCategories, setShowCategories] = useState(true);

  return (
    <Card 
      sx={{ 
        mb: 2,
      }}
    >
      <CardContent>
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon color="success" />
            <Typography variant="h6" fontWeight={600}>
              Filtros de Busca
            </Typography>
            {hasFilters && (
              <Chip 
                label={categoriasSelected.length || raio !== 5 ? 'Ativos' : ''} 
                size="small" 
                color="success"
                sx={{ ml: 0.5 }}
              />
            )}
          </Box>
          {hasFilters && (
            <IconButton size="small" onClick={handleClearFilters} color="error">
              <ClearIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Raio de busca */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              📏 Raio de busca
            </Typography>
            <Chip 
              label={`${localRaio} km`} 
              size="small" 
              color="success" 
              variant={raio !== 5 ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Slider
            value={localRaio}
            onChange={handleRaioChange}
            onChangeCommitted={handleRaioCommit}
            min={1}
            max={50}
            step={1}
            marks={[
              { value: 1, label: '1' },
              { value: 10, label: '10' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
            ]}
            valueLabelDisplay="auto"
            color="success"
            sx={{
              '& .MuiSlider-thumb': {
                width: 20,
                height: 20,
              },
              '& .MuiSlider-track': {
                height: 6,
              },
              '& .MuiSlider-rail': {
                height: 6,
              },
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Filtro por categorias */}
        <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1,
              cursor: 'pointer',
            }}
            onClick={() => setShowCategories(!showCategories)}
          >
            <FormLabel component="legend">
              <Typography variant="subtitle2" color="text.secondary">
                ♻️ Materiais aceitos {categoriasSelected.length > 0 && `(${categoriasSelected.length})`}
              </Typography>
            </FormLabel>
            <IconButton size="small">
              {showCategories ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={showCategories}>
            <FormGroup>
              {categoriasArray.map((categoria) => {
                const isSelected = categoriasSelected.includes(categoria.id);
                return (
                  <FormControlLabel
                    key={categoria.id}
                    control={
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleCategoriaToggle(categoria.id)}
                        color="success"
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                          {categoria.tipo}
                        </Typography>
                        {categoria.descricao && (
                          <Typography variant="caption" color="text.secondary">
                            {categoria.descricao.slice(0, 50)}...
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{
                      mb: 0.5,
                      borderRadius: 1,
                      px: 1,
                      mx: -1,
                      transition: 'background-color 0.2s',
                      bgcolor: isSelected ? 'success.50' : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected ? 'success.100' : 'action.hover',
                      },
                    }}
                  />
                );
              })}
            </FormGroup>
          </Collapse>
        </FormControl>

        {/* Chips de filtros ativos */}
        {categoriasSelected.length > 0 && (
          <Box sx={{ mb: 2, mt: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight={600}>
              🏷️ Filtros ativos:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {categoriasSelected.map((catId) => {
                const categoria = categorias.get(catId);
                return (
                  <Chip
                    key={catId}
                    label={categoria?.tipo || 'Categoria'}
                    size="small"
                    color="success"
                    onDelete={() => handleCategoriaToggle(catId)}
                    sx={{
                      fontWeight: 500,
                      '& .MuiChip-deleteIcon': {
                        fontSize: '1.1rem',
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Botões de ação */}
        <Stack spacing={1.5}>
          <Button
            variant="contained"
            color="success"
            fullWidth
            size="large"
            startIcon={loading ? null : <SearchIcon />}
            onClick={onSearch}
            disabled={loading}
            sx={{ 
              fontWeight: 600,
              py: 1.5,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
              },
            }}
          >
            {loading ? '🔄 Buscando...' : 'Buscar Receptoras'}
          </Button>
        </Stack>

        {/* Informação adicional */}
        <Box 
          sx={{ 
            mt: 2, 
            p: 1.5, 
            bgcolor: 'success.50', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'success.200',
          }}
        >
          <Typography variant="caption" color="text.primary" fontWeight={500}>
            💡 <strong>Dica:</strong> Selecione os tipos de materiais que deseja entregar para encontrar receptoras adequadas.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

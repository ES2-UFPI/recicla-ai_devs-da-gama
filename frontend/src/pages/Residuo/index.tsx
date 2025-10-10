import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Typography, Paper, Button, Collapse, Stack, MenuItem, Select, InputLabel, FormControl, TablePagination, useMediaQuery, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { UnidadeMedida, Categoria } from '../../types/residuo';
import { DesktopTable, MobileCards } from './components';
import { ResiduoForm } from './components/ResiduoForm';
// sem necessidade de importar unidades aqui (usado dentro do ResiduoForm)
import { HttpResiduosAdapter, MockResiduosAdapter } from './adapters';
import type { ResiduoDTO, ResiduosPort } from './types';

// imports de utilitários/constantes e componentes foram extraídos para arquivos dedicados

export default function Residuo() {
  // Hook para detectar mobile
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Escolha automática do adapter: se tiver BASE_URL, usa HTTP; senão, Mock
  const useHttp = Boolean(import.meta.env.VITE_API_BASE_URL);
  const adapter: ResiduosPort = useMemo(
    () => (useHttp ? new HttpResiduosAdapter() : new MockResiduosAdapter()),
    [useHttp]
  );

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [residuos, setResiduos] = useState<ResiduoDTO[]>([]);

  // UI state
  const [openForm, setOpenForm] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');

  const filtered = useMemo(() => {
    const base = filtroCategoria
      ? residuos.filter((r) => r.categoriaId === filtroCategoria)
      : residuos;
    // já estão ordenados por mais recente
    return base;
  }, [residuos, filtroCategoria]);

  const handleToggleForm = () => setOpenForm((v) => !v);
  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };
  const toggleDetails = (id: string) => setExpandedRow((prev) => (prev === id ? null : id));

  // sem reset local do formulário; o componente ResiduoForm gerencia seu próprio estado

  // Carregar lista inicial via adapter
  useEffect(() => {
    let active = true;
    adapter
      .list()
      .then(({ residuos, categorias }) => {
        if (!active) return;
        setResiduos(residuos);
        setCategorias(categorias);
      })
      .catch(() => {
        // opcional: tratar erro de rede
      });
    return () => {
      active = false;
    };
  }, [adapter]);

  // Função de cadastro: preview local só no formulário, nunca na tabela
  const handleCadastrar = async (data: { quantidade: number; unidade: UnidadeMedida; categoriaId: string; foto: File }) => {
    const novo = await adapter.create(data);
    setResiduos((prev) => [novo, ...prev]);
    setOpenForm(false);
  };

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // UI extraída para componentes: MobileCards e DesktopTable

  return (
    <MainLayout>
      <Paper elevation={1} sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" spacing={2}>
          <Typography variant="h4" fontWeight={700} color="primary.main">
            Gerenciamento de Resíduos
          </Typography>
          <Button variant="contained" color="primary" onClick={handleToggleForm} startIcon={openForm ? <ExpandLessIcon /> : <ExpandMoreIcon />} sx={{ fontWeight: 600 }}>
            Cadastrar Resíduo
          </Button>
        </Stack>

        <Collapse in={openForm} timeout="auto" unmountOnExit>
          <ResiduoForm categorias={categorias} onSubmit={handleCadastrar} />
        </Collapse>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mt: 3 }}>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="filtro-categoria-label">Filtrar por Categoria</InputLabel>
            <Select labelId="filtro-categoria-label" label="Filtrar por Categoria" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
              <MenuItem value="">Todas</MenuItem>
              {categorias.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Renderização responsiva: Cards no mobile, Tabela no desktop */}
        {isMobile ? (
          <MobileCards itens={paginated} categorias={categorias} expandedId={expandedRow} onToggle={toggleDetails} />
        ) : (
          <DesktopTable itens={paginated} categorias={categorias} expandedId={expandedRow} onToggle={toggleDetails} />
        )}

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20]}
          labelRowsPerPage="Itens por página"
        />
      </Paper>
    </MainLayout>
  );
}

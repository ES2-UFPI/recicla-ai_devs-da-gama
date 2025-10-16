import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Navbar } from '../../components/Navbar';

// Interface para Agendamento
interface Agendamento {
  id: string;
  data: string;
  horario: string;
  localizacao: string;
  status: 'pendente' | 'confirmado' | 'concluído' | 'cancelado';
  descricao: string;
}

// Mock data
const mockAgendamentos: Agendamento[] = [
  {
    id: '1',
    data: '2025-10-20',
    horario: '14:00',
    localizacao: 'Rua A, 123 - Centro',
    status: 'confirmado',
    descricao: 'Coleta de resíduos eletrônicos',
  },
  {
    id: '2',
    data: '2025-10-22',
    horario: '10:30',
    localizacao: 'Avenida B, 456 - Bairro X',
    status: 'pendente',
    descricao: 'Coleta de plásticos e papéis',
  },
  {
    id: '3',
    data: '2025-10-18',
    horario: '16:00',
    localizacao: 'Rua C, 789 - Zona Industrial',
    status: 'concluído',
    descricao: 'Coleta de metais',
  },
];

// Mapa de cores para status
const statusColorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  pendente: 'warning',
  confirmado: 'success',
  concluído: 'info',
  cancelado: 'error',
};

// Mapa de labels para status
const statusLabelMap: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  concluído: 'Concluído',
  cancelado: 'Cancelado',
};

export function Agendamento() {
  const theme = useTheme();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(mockAgendamentos);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Agendamento, 'id'>>({
    data: '',
    horario: '',
    localizacao: '',
    status: 'pendente',
    descricao: '',
  });

  // Handlers
  const handleOpenDialog = (agendamento?: Agendamento) => {
    if (agendamento) {
      setEditingId(agendamento.id);
      setFormData({
        data: agendamento.data,
        horario: agendamento.horario,
        localizacao: agendamento.localizacao,
        status: agendamento.status,
        descricao: agendamento.descricao,
      });
    } else {
      setEditingId(null);
      setFormData({
        data: '',
        horario: '',
        localizacao: '',
        status: 'pendente',
        descricao: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (editingId) {
      // Editar existente
      setAgendamentos(
        agendamentos.map((a) =>
          a.id === editingId ? { ...a, ...formData } : a
        )
      );
    } else {
      // Criar novo
      const novoAgendamento: Agendamento = {
        id: Date.now().toString(),
        ...formData,
      };
      setAgendamentos([...agendamentos, novoAgendamento]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setAgendamentos(agendamentos.filter((a) => a.id !== id));
  };

  const handleInputChange = (
    field: keyof Omit<Agendamento, 'id'>,
    value: string
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Cabeçalho */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon
              sx={{
                fontSize: '2rem',
                color: theme.palette.primary.main,
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              Meus Agendamentos
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: '0.5rem',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Novo Agendamento
          </Button>
        </Box>

        {/* Grid de Agendamentos */}
        {agendamentos.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {agendamentos.map((agendamento) => (
              <Box key={agendamento.id}>
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
                  <CardContent sx={{ flex: 1 }}>
                    {/* Status Badge */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={statusLabelMap[agendamento.status]}
                        color={statusColorMap[agendamento.status]}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                    {/* Descrição */}
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {agendamento.descricao}
                    </Typography>

                    {/* Data e Horário */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      <CalendarMonthIcon sx={{ fontSize: '1.2rem' }} />
                      <Typography variant="body2">
                        {new Date(agendamento.data).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>

                    {/* Horário */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: '1.2rem' }} />
                      <Typography variant="body2">
                        {agendamento.horario}
                      </Typography>
                    </Box>

                    {/* Localização */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      <LocationOnIcon sx={{ fontSize: '1.2rem', mt: 0.25 }} />
                      <Typography variant="body2">
                        {agendamento.localizacao}
                      </Typography>
                    </Box>
                  </CardContent>

                  {/* Ações */}
                  <CardActions sx={{ pt: 0 }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(agendamento)}
                      sx={{
                        color: theme.palette.primary.main,
                        textTransform: 'none',
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(agendamento.id)}
                      sx={{
                        color: theme.palette.error.main,
                        textTransform: 'none',
                      }}
                    >
                      Deletar
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: theme.palette.action.hover,
              borderRadius: '0.75rem',
              border: `2px dashed ${theme.palette.divider}`,
            }}
          >
            <CalendarMonthIcon
              sx={{
                fontSize: '3rem',
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            >
              Nenhum agendamento encontrado
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: '0.5rem',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Criar primeiro agendamento
            </Button>
          </Box>
        )}

        {/* Dialog para criar/editar agendamento */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              size="small"
            />
            <TextField
              label="Data"
              type="date"
              value={formData.data}
              onChange={(e) => handleInputChange('data', e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Horário"
              type="time"
              value={formData.horario}
              onChange={(e) => handleInputChange('horario', e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Localização"
              value={formData.localizacao}
              onChange={(e) => handleInputChange('localizacao', e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />
            <TextField
              label="Status"
              select
              value={formData.status}
              onChange={(e) =>
                handleInputChange(
                  'status',
                  e.target.value as Agendamento['status']
                )
              }
              fullWidth
              variant="outlined"
              size="small"
              SelectProps={{
                native: true,
              }}
            >
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="concluído">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleCloseDialog} variant="outlined">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
            >
              {editingId ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

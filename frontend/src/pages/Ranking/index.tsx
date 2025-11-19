import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RecyclingIcon from '@mui/icons-material/Recycling';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../hooks/useAuth';

// Interface para usuário no ranking
interface RankingUser {
  id: string;
  name: string;
  points: number;
  ranking: number;
  cidade?: string;
  estado?: string;
}

// Tipo das abas de ranking
type RankingTab = 'municipal' | 'estadual' | 'geral';

// Mock data para testes (será substituído pela API real)
const generateMockRanking = (type: RankingTab, currentUserId: string, currentUserPoints: number): RankingUser[] => {
  const names = [
    'Maria Silva', 'João Santos', 'Ana Paula', 'Carlos Eduardo', 'Juliana Costa',
    'Pedro Alves', 'Beatriz Lima', 'Rafael Souza', 'Camila Oliveira', 'Lucas Pereira',
    'Fernanda Martins', 'Gabriel Rocha', 'Patrícia Dias', 'Bruno Cardoso', 'Mariana Nunes'
  ];
  
  const cidades = ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano'];
  const estados = ['PI', 'MA', 'CE', 'BA', 'PE'];
  
  // Gera um ranking com pontuações decrescentes
  const basePoints = type === 'geral' ? 10000 : type === 'estadual' ? 5000 : 2000;
  const decrement = type === 'geral' ? 500 : type === 'estadual' ? 300 : 150;
  
  const ranking: RankingUser[] = names.slice(0, 10).map((name, idx) => ({
    id: `user_${idx + 1}`,
    name,
    points: basePoints - (idx * decrement),
    ranking: idx + 1,
    cidade: cidades[Math.floor(Math.random() * cidades.length)],
    estado: estados[Math.floor(Math.random() * estados.length)],
  }));
  
  // Adiciona o usuário atual se ele não estiver no top 10
  const userInTop10 = currentUserPoints >= ranking[ranking.length - 1].points;
  
  if (!userInTop10) {
    // Calcula posição do usuário (exemplo: entre 11 e 50)
    const userPosition = 15 + Math.floor(Math.random() * 35);
    ranking.push({
      id: currentUserId,
      name: 'Você',
      points: currentUserPoints,
      ranking: userPosition,
      cidade: 'Teresina',
      estado: 'PI',
    });
  }
  
  return ranking;
};

export default function Ranking() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentTab, setCurrentTab] = useState<RankingTab>('municipal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock: pontuação do usuário (será obtida do user.points na API real)
  const userPoints = user?.points || 850;
  
  // Mock data para cada tipo de ranking
  const [rankingData, setRankingData] = useState<{
    municipal: RankingUser[];
    estadual: RankingUser[];
    geral: RankingUser[];
  }>({
    municipal: [],
    estadual: [],
    geral: [],
  });

  useEffect(() => {
    // Simula carregamento de dados da API
    const fetchRankingData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // TODO: Substituir por chamada real à API
        // const response = await api.get(`/ranking/${currentTab}`);
        
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        const mockData = generateMockRanking(currentTab, user?.id || 'current_user', userPoints);
        
        setRankingData(prev => ({
          ...prev,
          [currentTab]: mockData,
        }));
      } catch (err) {
        console.error('Erro ao carregar ranking:', err);
        setError('Erro ao carregar dados do ranking. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [currentTab, user?.id, userPoints]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: RankingTab) => {
    setCurrentTab(newValue);
  };

  const getCurrentRanking = () => rankingData[currentTab];
  
  const top10 = getCurrentRanking().filter(u => u.ranking <= 10);
  const userPosition = getCurrentRanking().find(u => u.id === user?.id);
  const userInTop10 = userPosition && userPosition.ranking <= 10;

  const getMedalIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
  };

  const getTabIcon = (tab: RankingTab) => {
    if (tab === 'municipal') return <LocationOnIcon fontSize="small" />;
    if (tab === 'estadual') return <LocationOnIcon fontSize="small" />;
    return <PublicIcon fontSize="small" />;
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Cabeçalho */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <EmojiEventsIcon
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                color: theme.palette.warning.main,
              }}
            />
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              Ranking de Reciclagem
            </Typography>
          </Box>
          
          {/* Pontuação do Usuário */}
          <Paper
            elevation={3}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              px: 3,
              py: 2,
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: '1rem',
            }}
          >
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Sua Pontuação
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {userPoints.toLocaleString('pt-BR')}
              </Typography>
            </Box>
            {userPosition && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Sua Posição
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  #{userPosition.ranking}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Tabs de Ranking */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            centered={!isMobile}
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: '0.75rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.875rem', md: '1rem' },
              },
            }}
          >
            <Tab
              label="Municipal"
              value="municipal"
              icon={getTabIcon('municipal')}
              iconPosition="start"
            />
            <Tab
              label="Estadual"
              value="estadual"
              icon={getTabIcon('estadual')}
              iconPosition="start"
            />
            <Tab
              label="Geral"
              value="geral"
              icon={getTabIcon('geral')}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Conteúdo do Ranking */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Top 10 */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ mb: 2, color: 'primary.main' }}
              >
                🏆 Top 10 - Ranking {currentTab === 'municipal' ? 'Municipal' : currentTab === 'estadual' ? 'Estadual' : 'Geral'}
              </Typography>
              
              {top10.length === 0 ? (
                <Alert severity="info">
                  Nenhum dado de ranking disponível no momento.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {top10.map((rankingUser) => {
                    const isCurrentUser = rankingUser.id === user?.id;
                    const medal = getMedalIcon(rankingUser.ranking);
                    
                    return (
                      <Card
                        key={rankingUser.id}
                        sx={{
                          borderRadius: '0.75rem',
                          boxShadow: isCurrentUser ? '0 4px 16px rgba(56, 142, 60, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                          border: isCurrentUser ? 2 : 0,
                          borderColor: 'primary.main',
                          bgcolor: isCurrentUser ? 'primary.50' : 'background.paper',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: isCurrentUser ? '0 6px 20px rgba(56, 142, 60, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                          },
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              flexWrap: isMobile ? 'wrap' : 'nowrap',
                            }}
                          >
                            {/* Posição */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: { xs: '3rem', md: '3.5rem' },
                                height: { xs: '3rem', md: '3.5rem' },
                                bgcolor: rankingUser.ranking <= 3 ? 'warning.main' : 'grey.200',
                                borderRadius: '50%',
                                fontWeight: 700,
                                fontSize: { xs: '1.25rem', md: '1.5rem' },
                                color: rankingUser.ranking <= 3 ? 'white' : 'text.primary',
                              }}
                            >
                              {medal || `#${rankingUser.ranking}`}
                            </Box>

                            {/* Avatar e Nome */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                              <Avatar
                                sx={{
                                  width: { xs: '2.5rem', md: '3rem' },
                                  height: { xs: '2.5rem', md: '3rem' },
                                  bgcolor: isCurrentUser ? 'primary.main' : 'secondary.main',
                                  fontWeight: 600,
                                }}
                              >
                                {rankingUser.name[0].toUpperCase()}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="h6"
                                  fontWeight={600}
                                  sx={{
                                    color: isCurrentUser ? 'primary.main' : 'text.primary',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {rankingUser.name}
                                  {isCurrentUser && (
                                    <Chip
                                      label="Você"
                                      size="small"
                                      color="primary"
                                      sx={{ ml: 1, fontWeight: 600 }}
                                    />
                                  )}
                                </Typography>
                                {currentTab !== 'geral' && (
                                  <Typography variant="caption" color="text.secondary">
                                    {rankingUser.cidade} - {rankingUser.estado}
                                  </Typography>
                                )}
                              </Box>
                            </Box>

                            {/* Pontos */}
                            <Box
                              sx={{
                                textAlign: 'right',
                                minWidth: { xs: '100%', sm: 'auto' },
                                mt: { xs: 1, sm: 0 },
                              }}
                            >
                              <Typography variant="h6" fontWeight={700} color="success.main">
                                {rankingUser.points.toLocaleString('pt-BR')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                pontos
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Box>

            {/* Posição do Usuário (se não estiver no top 10) */}
            {!userInTop10 && userPosition && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ mb: 2, color: 'text.secondary' }}
                >
                  Sua Posição
                </Typography>
                <Card
                  sx={{
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 16px rgba(56, 142, 60, 0.3)',
                    border: 2,
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: { xs: '3rem', md: '3.5rem' },
                          height: { xs: '3rem', md: '3.5rem' },
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          fontWeight: 700,
                          fontSize: { xs: '1rem', md: '1.25rem' },
                          color: 'white',
                        }}
                      >
                        #{userPosition.ranking}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <Avatar
                          sx={{
                            width: { xs: '2.5rem', md: '3rem' },
                            height: { xs: '2.5rem', md: '3rem' },
                            bgcolor: 'primary.main',
                            fontWeight: 600,
                          }}
                        >
                          {user?.name?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} color="primary.main">
                            {user?.name || 'Você'}
                          </Typography>
                          {currentTab !== 'geral' && (
                            <Typography variant="caption" color="text.secondary">
                              {userPosition.cidade} - {userPosition.estado}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: 'right', minWidth: { xs: '100%', sm: 'auto' }, mt: { xs: 1, sm: 0 } }}>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          {userPosition.points.toLocaleString('pt-BR')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          pontos
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </>
        )}

        {/* Call to Action */}
        <Box
          sx={{
            mt: 4,
            p: 3,
            bgcolor: 'success.light',
            borderRadius: '0.75rem',
            textAlign: 'center',
          }}
        >
          <RecyclingIcon
            sx={{
              fontSize: '3rem',
              color: 'success.dark',
              mb: 2,
            }}
          />
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'success.dark' }}>
            Quer subir no ranking?
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', maxWidth: '600px', mx: 'auto' }}>
            Cadastre seus resíduos e agende uma coleta para ganhar mais pontos e subir no ranking!
            Quanto mais você recicla, mais pontos acumula e melhor fica sua posição.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<RecyclingIcon />}
            onClick={() => navigate('/residuos')}
            sx={{
              borderRadius: '0.5rem',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
            }}
          >
            Cadastrar Resíduos
          </Button>
        </Box>
      </Container>
    </>
  );
}

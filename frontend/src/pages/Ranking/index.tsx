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
import rankingService, { type RankingEntry } from '../../services/rankingService';

// Usar diretamente RankingEntry da API
type RankingUser = RankingEntry;

// Tipo das abas de ranking
type RankingTab = 'cidade' | 'estado' | 'global';

// Mapeia tab para nível da API
const tabToLevel: Record<RankingTab, 'cidade' | 'estado' | 'global'> = {
  cidade: 'cidade',
  estado: 'estado',
  global: 'global',
};

export default function Ranking() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentTab, setCurrentTab] = useState<RankingTab>('cidade');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankingData, setRankingData] = useState<RankingUser[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [rankingTitle, setRankingTitle] = useState<string>('Ranking Municipal');
  
  // Pontuação de ranking do usuário
  const userRanking = user?.ranking || 0;

  useEffect(() => {
    const fetchRankingData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const level = tabToLevel[currentTab];
        
        // Determina o code baseado no tipo de ranking
        let code: string | undefined;
        if (level === 'cidade') {
          code = user.cidade; // cidade_id do usuário
        } else if (level === 'estado') {
          code = user.estado; // estado_id do usuário
        }
        
        // Busca ranking e posição do usuário em paralelo
        const [rankingResponse, position] = await Promise.all([
          rankingService.getRanking(level, code, 10),
          rankingService.getUserPosition(user.id, level, code),
        ]);
        
        // Atualiza título baseado na resposta da API
        if (level === 'cidade' && rankingResponse.cidade_nome) {
          setRankingTitle(`Ranking ${rankingResponse.cidade_nome}`);
        } else if (level === 'estado' && rankingResponse.estado_nome) {
          setRankingTitle(`Ranking ${rankingResponse.estado_nome}`);
        } else {
          setRankingTitle('Ranking Geral');
        }
        
        // Usar diretamente os dados da API
        const usersWithRanking: RankingUser[] = rankingResponse.top;
        
        setRankingData(usersWithRanking);
        setUserPosition(position);
      } catch (err) {
        console.error('Erro ao carregar ranking:', err);
        setError('Erro ao carregar dados do ranking. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [currentTab, user?.id, user?.cidade, user?.estado]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: RankingTab) => {
    setCurrentTab(newValue);
  };

  const top10 = rankingData.filter(u => (u.position || 0) <= 10);
  const userInTop10 = userPosition !== null && userPosition <= 10;

  const getMedalIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
  };

  const getTabIcon = (tab: RankingTab) => {
    if (tab === 'cidade') return <LocationOnIcon fontSize="small" />;
    if (tab === 'estado') return <LocationOnIcon fontSize="small" />;
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
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Sua Pontuação
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {userRanking.toLocaleString('pt-BR')}
              </Typography>
            </Box>
            {userPosition !== null && userPosition > 0 && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Sua Posição
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  #{userPosition}
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
              value="cidade"
              icon={getTabIcon('cidade')}
              iconPosition="start"
            />
            <Tab
              label="Estadual"
              value="estado"
              icon={getTabIcon('estado')}
              iconPosition="start"
            />
            <Tab
              label="Geral"
              value="global"
              icon={getTabIcon('global')}
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
                🏆 Top 10 - {rankingTitle}
              </Typography>
              
              {top10.length === 0 ? (
                <Alert severity="info">
                  Nenhum dado de ranking disponível no momento.
                </Alert>
              ) : (
                <Stack spacing={1.5}>
                  {top10.map((rankingUser) => {
                    const isCurrentUser = rankingUser.user_id === user?.id;
                    const medal = getMedalIcon(rankingUser.ranking);
                    
                    return (
                      <Card
                        key={rankingUser.user_id}
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
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
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
                                bgcolor: rankingUser.position === 1 ? '#FFD700' : rankingUser.position === 2 ? '#C0C0C0' : rankingUser.position === 3 ? '#CD7F32' : 'grey.200',
                                borderRadius: '50%',
                                fontWeight: 700,
                                fontSize: { xs: '1.25rem', md: '1.5rem' },
                                color: (rankingUser.position || 0) <= 3 ? 'white' : 'text.primary',
                                boxShadow: (rankingUser.position || 0) <= 3 ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                              }}
                            >
                              {medal || `#${rankingUser.position}`}
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
                                {rankingUser.name?.[0]?.toUpperCase() || 'U'}
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
                                  {rankingUser.name || 'Usuário'}
                                  {isCurrentUser && (
                                    <Chip
                                      label="Você"
                                      size="small"
                                      color="primary"
                                      sx={{ ml: 1, fontWeight: 600 }}
                                    />
                                  )}
                                </Typography>
                                {rankingUser.cidade_id && rankingUser.estado_id && (
                                  <Typography variant="caption" color="text.secondary">
                                    {rankingUser.cidade_id} - {rankingUser.estado_id}
                                  </Typography>
                                )}
                              </Box>
                            </Box>

                            {/* Pontos de Ranking */}
                            <Box
                              sx={{
                                textAlign: 'right',
                                minWidth: { xs: '100%', sm: 'auto' },
                                mt: { xs: 1, sm: 0 },
                              }}
                            >
                              <Typography variant="h6" fontWeight={700} color="success.main">
                                {rankingUser.ranking.toLocaleString('pt-BR')}
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
            {!userInTop10 && userPosition !== null && userPosition > 0 && (
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
                        #{userPosition}
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
                          {user?.cidade && user?.estado && (
                            <Typography variant="caption" color="text.secondary">
                              {user.cidade} - {user.estado}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: 'right', minWidth: { xs: '100%', sm: 'auto' }, mt: { xs: 1, sm: 0 } }}>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          {userRanking.toLocaleString('pt-BR')}
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

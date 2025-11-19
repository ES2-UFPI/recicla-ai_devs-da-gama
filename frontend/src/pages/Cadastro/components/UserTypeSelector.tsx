import { Box, Card, CardContent, Typography, Container, alpha } from '@mui/material';
import { 
  RecyclingOutlined, 
  LocalShippingOutlined, 
  BusinessOutlined 
} from '@mui/icons-material';
import type { RoleType, UserTypeOption } from '../types';

const userTypeOptions: UserTypeOption[] = [
  {
    value: 'produtor',
    title: 'Sou Produtor',
    description: 'Tenho resíduos para destinar de forma sustentável',
    icon: 'recycling',
    color: '#2e7d32',
  },
  {
    value: 'coletor',
    title: 'Sou Coletor',
    description: 'Realizo coleta e transporte de resíduos recicláveis',
    icon: 'shipping',
    color: '#1976d2',
  },
  {
    value: 'receptor',
    title: 'Sou Ponto de Coleta',
    description: 'Recebo e processo materiais recicláveis',
    icon: 'business',
    color: '#7b1fa2',
  },
];

const iconMap = {
  recycling: RecyclingOutlined,
  shipping: LocalShippingOutlined,
  business: BusinessOutlined,
};

interface UserTypeSelectorProps {
  onSelectType: (type: RoleType) => void;
}

export function UserTypeSelector({ onSelectType }: UserTypeSelectorProps) {
  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight={700}
          sx={{ mb: 2, color: 'text.primary' }}
        >
          Bem-vindo ao ReciclaAi! ♻️
        </Typography>
        <Typography 
          variant="h6" 
          component="p" 
          sx={{ color: 'text.secondary', fontWeight: 400 }}
        >
          Como você gostaria de contribuir com a reciclagem?
        </Typography>
      </Box>

      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4
        }}
      >
        {userTypeOptions.map((option) => {
          const IconComponent = iconMap[option.icon as keyof typeof iconMap];
          
          return (
            <Card
              key={option.value}
              onClick={() => onSelectType(option.value)}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '2px solid',
                borderColor: 'transparent',
                '&:hover': {
                  borderColor: option.color,
                  transform: 'translateY(-8px)',
                  boxShadow: `0 12px 24px ${alpha(option.color, 0.2)}`,
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  p: 4,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    margin: '0 auto',
                    borderRadius: '50%',
                    backgroundColor: alpha(option.color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                  }}
                >
                  <IconComponent 
                    sx={{ 
                      fontSize: 48, 
                      color: option.color 
                    }} 
                  />
                </Box>

                <Typography 
                  variant="h6" 
                  component="h3" 
                  fontWeight={600}
                  sx={{ color: 'text.primary' }}
                >
                  {option.title}
                </Typography>

                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.6,
                  }}
                >
                  {option.description}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Já tem uma conta?{' '}
          <a 
            href="/login" 
            style={{ 
              color: '#2e7d32', 
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            Entrar
          </a>
        </Typography>
      </Box>
    </Container>
  );
}

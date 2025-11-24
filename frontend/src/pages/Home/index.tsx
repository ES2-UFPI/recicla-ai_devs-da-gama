import { MainLayout } from '../../layouts/MainLayout';
import { useRoleCheck } from '../../hooks/useRoleCheck';
import { Typography, Box, Button } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssessmentIcon from '@mui/icons-material/Assessment';

export default function Home() {
	const { isProdutor, isColetor, isReceptor } = useRoleCheck();

	return (
		<MainLayout>
			<Box sx={{ textAlign: 'center', mt: { xs: 2, md: 6 } }}>
				<Typography variant="h3" fontWeight={700} color="primary.main" gutterBottom>
					Bem-vindo ao ReciclaAi!
				</Typography>
				<Typography variant="h5" color="text.secondary" gutterBottom>
					Sua plataforma para reciclagem inteligente, recompensas e sustentabilidade.
				</Typography>

				{/* Botão condicional baseado no role */}
				<Box sx={{ mt: 4 }}>
					{isProdutor && (
						<Button
							variant="contained"
							color="primary"
							size="large"
							startIcon={<CalendarMonthIcon />}
							sx={{ fontWeight: 600 }}
							href="/agendamentos"
						>
							Agendar coleta agora
						</Button>
					)}

					{isColetor && (
						<Button
							variant="contained"
							color="primary"
							size="large"
							startIcon={<LocalShippingIcon />}
							sx={{ fontWeight: 600 }}
							href="/coletas"
						>
							Fazer coleta
						</Button>
					)}

					{isReceptor && (
						<Button
							variant="contained"
							color="primary"
							size="large"
							startIcon={<AssessmentIcon />}
							sx={{ fontWeight: 600 }}
							href="/relatorio"
						>
							Relatório de Reciclagem
						</Button>
					)}
				</Box>

				{/* Mensagem de boas-vindas personalizada (opcional) */}
				<Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
					{isProdutor && 'Cadastre seus resíduos e agende coletas de forma fácil.'}
					{isColetor && 'Gerencie e faça suas coletas'}
					{isReceptor && 'Acompanhe os resíduos recebidos e gere relatórios.'}
				</Typography>
			</Box>
		</MainLayout>
	);
}

import { MainLayout } from '../../layouts/MainLayout';
import { Typography, Box, Button } from '@mui/material';

export default function Home() {
	return (
		<MainLayout>
			<Box sx={{ textAlign: 'center', mt: { xs: 2, md: 6 } }}>
				<Typography variant="h3" fontWeight={700} color="primary.main" gutterBottom>
					Bem-vindo ao ReciclaAi!
				</Typography>
				<Typography variant="h5" color="text.secondary" gutterBottom>
					Sua plataforma para reciclagem inteligente, recompensas e sustentabilidade.
				</Typography>
				<Button
					variant="contained"
					color="primary"
					size="large"
					sx={{ mt: 4, fontWeight: 600 }}
					href="/agendamentos"
				>
					Agendar coleta agora
				</Button>
			</Box>
		</MainLayout>
	);
}

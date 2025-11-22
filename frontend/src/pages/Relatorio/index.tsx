import { Container, Box, CircularProgress, Alert } from '@mui/material';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { useRelatorio } from './hooks/useRelatorio';
import {
  RelatorioHeader,
  SummaryCards,
  EmptyState,
  RelatorioTable,
  SuccessMessage,
  ExportButtons,
} from './components';

export default function Relatorio() {
  const { user } = useAuth();
  const { loading, error, reportData, totalKg, totalUnidades } = useRelatorio();

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        <RelatorioHeader />

        {!loading && reportData.length > 0 && (
          <SummaryCards totalKg={totalKg} totalUnidades={totalUnidades} />
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : reportData.length === 0 ? (
          <EmptyState userRole={user?.role} />
        ) : (
          <>
            <ExportButtons
              data={reportData}
              userName={user?.name || 'Usuário'}
              userEmail={user?.email || ''}
              userRole={user?.role || ''}
            />
            <RelatorioTable data={reportData} />
            <SuccessMessage />
          </>
        )}
      </Container>
    </>
  );
}

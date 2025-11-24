import { useState, useEffect } from 'react';
import { relatorioService, type CategoryQuantity } from '../../../services/relatorio.service';

export function useRelatorio() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<CategoryQuantity[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await relatorioService.getMyReport();
        setReportData(response.by_category);
      } catch (err) {
        console.error('Erro ao carregar relatório:', err);
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response?: { status?: number } };
          if (axiosError.response?.status === 403) {
            setError('Relatório disponível apenas para produtores e receptores.');
          } else {
            setError('Erro ao carregar relatório. Tente novamente.');
          }
        } else {
          setError('Erro ao carregar relatório. Tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  // Calcula totais
  const totalKg = reportData
    .filter(item => item.tipo_medida === 'kg')
    .reduce((sum, item) => sum + item.quantidade, 0);
  
  const totalUnidades = reportData
    .filter(item => item.tipo_medida === 'unidade')
    .reduce((sum, item) => sum + item.quantidade, 0);

  return {
    loading,
    error,
    reportData,
    totalKg,
    totalUnidades,
  };
}

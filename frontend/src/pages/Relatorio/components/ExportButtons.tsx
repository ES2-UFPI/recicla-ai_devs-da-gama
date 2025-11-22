import { Box, Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CategoryQuantity } from '../../../services/relatorio.service';

interface ExportButtonsProps {
  data: CategoryQuantity[];
  userName: string;
  userEmail: string;
  userRole: string;
}

export function ExportButtons({ data, userName, userEmail, userRole }: ExportButtonsProps) {
  const handleExportCSV = () => {
    // Prepara os dados para CSV
    const csvData = data.map(item => ({
      Categoria: item.categoria,
      Quantidade: item.quantidade,
      Medida: item.tipo_medida === 'kg' ? 'kg' : 'Unidade',
    }));

    // Converte para CSV
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escapa valores que contêm vírgula
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Cria o blob e inicia o download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-reciclagem-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Configurações
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Cabeçalho com informações do usuário
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Reciclagem', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
    
    // Linha separadora
    yPosition += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    
    // Informações do usuário
    yPosition += 10;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Informações do Usuário:', 20, yPosition);
    
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${userName}`, 25, yPosition);
    
    yPosition += 6;
    doc.text(`Email: ${userEmail}`, 25, yPosition);
    
    yPosition += 6;
    doc.text(`Tipo: ${userRole === 'produtor' ? 'Produtor' : 'Receptor'}`, 25, yPosition);
    
    // Linha separadora
    yPosition += 8;
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    
    // Prepara dados da tabela
    const tableData = data.map(item => [
      item.categoria,
      item.quantidade.toLocaleString('pt-BR', {
        minimumFractionDigits: item.tipo_medida === 'kg' ? 2 : 0,
        maximumFractionDigits: item.tipo_medida === 'kg' ? 2 : 0,
      }),
      item.tipo_medida === 'kg' ? 'kg' : 'Unidade',
    ]);

    // Adiciona a tabela usando autoTable diretamente
    autoTable(doc, {
      startY: yPosition + 5,
      head: [['Categoria', 'Quantidade', 'Medida']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [25, 118, 210], // Cor primária do Material-UI
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'center' },
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Rodapé
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Documento gerado automaticamente pelo sistema ReciclaAI',
      pageWidth / 2,
      finalY + 15,
      { align: 'center' }
    );

    // Salva o PDF
    doc.save(`relatorio-reciclagem-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap',
      }}
    >
      <Button
        variant="contained"
        color="error"
        startIcon={<PictureAsPdfIcon />}
        onClick={handleExportPDF}
        sx={{
          borderRadius: '0.5rem',
          textTransform: 'none',
          fontWeight: 600,
          px: 3,
        }}
      >
        Exportar PDF
      </Button>
      
      <Button
        variant="contained"
        color="success"
        startIcon={<TableChartIcon />}
        onClick={handleExportCSV}
        sx={{
          borderRadius: '0.5rem',
          textTransform: 'none',
          fontWeight: 600,
          px: 3,
        }}
      >
        Exportar CSV
      </Button>
    </Box>
  );
}

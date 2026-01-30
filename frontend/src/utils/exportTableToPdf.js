/**
 * Gera e faz download de um PDF com os dados da tabela.
 * Utiliza jsPDF e jspdf-autotable para tabelas com muitas linhas e quebra de página automática.
 *
 * @param {Object} options
 * @param {string} options.title - Título do relatório (ex.: nome da tabela)
 * @param {Array<{ key: string, label: string }>} options.columns - Definição das colunas
 * @param {Array<Record<string, unknown>>} options.data - Dados (um objeto por linha)
 * @param {{ mesAnterior: string, mesAtual: string } | null} [options.periodLabels] - Opcional. Labels de período para colunas consumo_mes_anterior / consumo_mes_atual
 */
export async function exportTableToPdf({ title, columns, data, periodLabels = null }) {
  if (!data || data.length === 0) return;

  const { jsPDF } = await import('jspdf');
  const autotableModule = await import('jspdf-autotable');
  const autoTableFn = typeof autotableModule.default === 'function' ? autotableModule.default : null;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const getHeaderText = (col) => {
    if (!periodLabels) return col.label;
    if (col.key === 'consumo_mes_anterior') return `Mês anterior (${periodLabels.mesAnterior})`;
    if (col.key === 'consumo_mes_atual') return `Mês atual (${periodLabels.mesAtual})`;
    return col.label;
  };

  const headers = columns.map((col) => getHeaderText(col));
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (value == null || value === '') return '-';
      return String(value);
    })
  );

  doc.setFontSize(14);
  doc.text(title, 14, 12);
  doc.setFontSize(10);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} • ${data.length} registro(s)`, 14, 18);

  const tableOptions = {
    head: [headers],
    body: rows,
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
  };
  if (autoTableFn) {
    autoTableFn(doc, tableOptions);
  } else if (typeof doc.autoTable === 'function') {
    doc.autoTable(tableOptions);
  } else {
    throw new Error('jspdf-autotable: plugin não disponível');
  }

  const fileName = `${title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

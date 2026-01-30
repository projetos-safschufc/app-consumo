import React, { useState } from 'react';
import { useApiData } from '../hooks/useApiData';
import RefreshButton from './RefreshButton';
import { exportTableToPdf } from '../utils/exportTableToPdf';
import './TableCard.css';

/**
 * Extrai ano e mês (1-12) de uma data ISO (YYYY-MM-DD) ou Date, sem depender de fuso.
 * Retorna { year, month } ou null se inválida.
 */
function parseYearMonth(value) {
  if (value == null) return null;
  const s = typeof value === 'string' ? value.split('T')[0].trim() : null;
  if (s) {
    const parts = s.split('-').map(Number);
    if (parts.length >= 2 && parts[0] >= 1970 && parts[1] >= 1 && parts[1] <= 12) {
      return { year: parts[0], month: parts[1] };
    }
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/**
 * Formata para MM/yyyy a partir de { year, month }. Retorna null se inválido.
 */
function formatMesAno(value) {
  const p = parseYearMonth(value);
  if (!p) return null;
  return `${String(p.month).padStart(2, '0')}/${p.year}`;
}

/**
 * Subtrai um mês e retorna string MM/yyyy. Usa ano/mês do valor (evita erro de fuso).
 */
function previousMonthMesAno(value) {
  const p = parseYearMonth(value);
  if (!p) return null;
  let { year, month } = p;
  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${String(month).padStart(2, '0')}/${year}`;
}

/**
 * Componente de card com tabela
 * @param {string} title - Título do card
 * @param {string} objective - Objetivo/descrição
 * @param {string} endpoint - Endpoint da API
 * @param {Array<{key: string, label: string}>} columns - Definição das colunas
 * @param {number} maxRows - Número máximo de linhas a exibir (modo resumido)
 * @param {boolean} enableViewAll - Se true, exibe botão "Ver todos" quando há mais itens que maxRows
 * @param {{ mesAtualKey: string }?} periodFromData - Se definido, usa data[0][mesAtualKey] para exibir período (Mês anterior | Mês atual) no cabeçalho e nas colunas
 * @param {number} refreshMs - Intervalo de atualização (0 = manual)
 * @param {number} initialDelay - Delay inicial antes da primeira requisição (ms)
 * @param {boolean} enablePdfExport - Se true, exibe botão "Exportar PDF" com todos os dados da tabela
 */
function TableCard({ title, objective, endpoint, columns, maxRows = 15, enableViewAll = false, periodFromData = null, refreshMs = 0, initialDelay = 0, enablePdfExport = false }) {
  const { data, status, lastUpdated, error, refresh, isLoading } = useApiData(endpoint, refreshMs, initialDelay);
  const [showAll, setShowAll] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  const handleExportPdf = async () => {
    if (!data || data.length === 0) return;
    setPdfExporting(true);
    try {
      const periodLabels = periodFromData && data.length > 0 && data[0][periodFromData.mesAtualKey] != null
        ? (() => {
            const mesAtualStr = formatMesAno(data[0][periodFromData.mesAtualKey]);
            const mesAnteriorStr = previousMonthMesAno(data[0][periodFromData.mesAtualKey]);
            return mesAtualStr && mesAnteriorStr ? { mesAnterior: mesAnteriorStr, mesAtual: mesAtualStr } : null;
          })()
        : null;
      await exportTableToPdf({ title, columns, data, periodLabels });
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
    } finally {
      setPdfExporting(false);
    }
  };

  const total = data?.length ?? 0;
  const hasMore = enableViewAll && total > maxRows;
  const rowsToShow = (enableViewAll && showAll) ? data : (data ?? []).slice(0, maxRows);
  const displayCount = (enableViewAll && showAll) ? total : Math.min(total, maxRows);

  const periodLabels = periodFromData && data?.length > 0 && data[0][periodFromData.mesAtualKey] != null
    ? (() => {
        const mesAtualStr = formatMesAno(data[0][periodFromData.mesAtualKey]);
        const mesAnteriorStr = previousMonthMesAno(data[0][periodFromData.mesAtualKey]);
        return mesAtualStr && mesAnteriorStr ? { mesAnterior: mesAnteriorStr, mesAtual: mesAtualStr } : null;
      })()
    : null;

  const getColumnLabel = (col) => {
    if (!periodLabels) return col.label;
    if (col.key === 'consumo_mes_anterior') return `Mês anterior (${periodLabels.mesAnterior})`;
    if (col.key === 'consumo_mes_atual') return `Mês atual (${periodLabels.mesAtual})`;
    return col.label;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>{title}</h3>
          <p>{objective}</p>
          {periodLabels && (
            <p className="table-card-period" aria-live="polite">
              Período: Mês anterior ({periodLabels.mesAnterior}) | Mês atual ({periodLabels.mesAtual})
            </p>
          )}
        </div>
        <div className="card-header-actions">
          {enablePdfExport && data && data.length > 0 && (
            <button
              type="button"
              className="table-card-pdf-btn"
              onClick={handleExportPdf}
              disabled={pdfExporting}
              aria-label="Exportar tabela em PDF"
            >
              {pdfExporting ? 'Gerando…' : 'Exportar PDF'}
            </button>
          )}
          {refreshMs === 0 && (
            <RefreshButton onClick={refresh} isLoading={isLoading} />
          )}
          {refreshMs > 0 && (
            <span className="status-pill">auto</span>
          )}
        </div>
      </div>
      
      {error ? (
        <div className="table-error">
          Erro ao carregar dados: {error.message}
        </div>
      ) : data && data.length > 0 ? (
        <>
          {hasMore && (
            <div className="table-card-view-all">
              <button
                type="button"
                className="table-card-view-all-btn"
                onClick={() => setShowAll(!showAll)}
                aria-expanded={showAll}
              >
                {showAll ? 'Ver menos' : `Ver todos (${total} itens)`}
              </button>
            </div>
          )}
          <div className={showAll ? 'table-card-scroll-wrap' : undefined}>
            <table className="table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{getColumnLabel(col)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowsToShow.map((row, index) => (
                  <tr key={index}>
                    {columns.map((col) => (
                      <td key={col.key}>{row[col.key] ?? '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="table-empty">
          {status === 'carregando...' ? 'Carregando dados...' : 'Nenhum dado disponível'}
        </div>
      )}
      
      <div className="status">
        {status}
        {total > 0 && (
          <span>
            {' • '}
            exibindo {displayCount}
            {total > displayCount ? ` de ${total}` : ''}
            {' registros'}
          </span>
        )}
        {lastUpdated ? ` • atualizado: ${lastUpdated.toLocaleTimeString('pt-BR')}` : ''}
      </div>
    </div>
  );
}

export default TableCard;

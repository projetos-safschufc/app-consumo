import React, { useState } from 'react';
import { useApiData } from '../hooks/useApiData';
import RefreshButton from './RefreshButton';
import './TableCard.css';

/**
 * Componente de card com tabela
 * @param {string} title - Título do card
 * @param {string} objective - Objetivo/descrição
 * @param {string} endpoint - Endpoint da API
 * @param {Array<{key: string, label: string}>} columns - Definição das colunas
 * @param {number} maxRows - Número máximo de linhas a exibir (modo resumido)
 * @param {boolean} enableViewAll - Se true, exibe botão "Ver todos" quando há mais itens que maxRows
 * @param {number} refreshMs - Intervalo de atualização (0 = manual)
 * @param {number} initialDelay - Delay inicial antes da primeira requisição (ms)
 */
function TableCard({ title, objective, endpoint, columns, maxRows = 15, enableViewAll = false, refreshMs = 0, initialDelay = 0 }) {
  const { data, status, lastUpdated, error, refresh, isLoading } = useApiData(endpoint, refreshMs, initialDelay);
  const [showAll, setShowAll] = useState(false);

  const total = data?.length ?? 0;
  const hasMore = enableViewAll && total > maxRows;
  const rowsToShow = (enableViewAll && showAll) ? data : (data ?? []).slice(0, maxRows);
  const displayCount = (enableViewAll && showAll) ? total : Math.min(total, maxRows);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>{title}</h3>
          <p>{objective}</p>
        </div>
        <div className="card-header-actions">
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
                    <th key={col.key}>{col.label}</th>
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

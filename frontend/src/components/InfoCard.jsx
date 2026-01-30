import React from 'react';
import { useApiData } from '../hooks/useApiData';
import RefreshButton from './RefreshButton';
import { formatNumber } from '../utils/formatters';
import './InfoCard.css';

/**
 * Componente de cartão informativo
 * @param {string} title - Título do card
 * @param {string} endpoint - Endpoint da API
 * @param {Function} formatValue - Função para formatar o valor
 * @param {string} unit - Unidade do valor
 * @param {number} refreshMs - Intervalo de atualização
 */
function InfoCard({ title, endpoint, formatValue, unit = '', refreshMs = 60000 }) {
  const { data, status, lastUpdated, error, refresh, isLoading } = useApiData(endpoint, refreshMs, 0);

  const getValue = () => {
    if (error || !data || data.length === 0) {
      return null;
    }

    // Busca a média aritmética dos últimos 6 consumos
    // O backend retorna: { data: [{ media_ultimos_6_consumos: number }] }
    const value = data[0]?.media_ultimos_6_consumos;
    
    // Valida se é um número válido
    if (value == null || isNaN(value) || !isFinite(value)) {
      return null;
    }
    
    return value;
  };

  const value = getValue();
  const displayValue = value !== null && value !== undefined 
    ? (formatValue ? formatValue(value) : formatNumber(value, 1))
    : null;

  return (
    <div className="info-card">
      <div className="info-card-header">
        <h3 className="info-card-title">{title}</h3>
        <div className="card-header-actions">
          {refreshMs === 0 && (
            <RefreshButton onClick={refresh} isLoading={isLoading} />
          )}
          {refreshMs > 0 && (
            <span className="status-pill">auto</span>
          )}
        </div>
      </div>
      
      <div className="info-card-content">
        {error ? (
          <div className="info-card-error">
            Erro ao carregar
          </div>
        ) : status === 'carregando...' ? (
          <div className="info-card-loading">Carregando...</div>
        ) : displayValue !== null ? (
          <>
            <div className="info-card-value">{displayValue}</div>
            {unit && <div className="info-card-unit">{unit}</div>}
          </>
        ) : (
          <div className="info-card-empty">Sem dados</div>
        )}
      </div>
      
      <div className="info-card-footer">
        {status}
        {lastUpdated ? ` • atualizado: ${lastUpdated.toLocaleTimeString('pt-BR')}` : ''}
      </div>
    </div>
  );
}

export default InfoCard;

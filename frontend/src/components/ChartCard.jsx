import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';
import { useApiData } from '../hooks/useApiData';
import RefreshButton from './RefreshButton';
import './ChartCard.css';

// Registra componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Componente de card com gráfico
 * @param {string} title - Título do card
 * @param {string} objective - Objetivo/descrição
 * @param {string} endpoint - Endpoint da API
 * @param {Function} buildConfig - Função que constrói a configuração do gráfico
 * @param {string} chartType - Tipo do gráfico ('line', 'bar', 'pie', 'scatter')
 * @param {number} refreshMs - Intervalo de atualização
 * @param {number} initialDelay - Delay inicial antes da primeira requisição (ms)
 * @param {Function} [renderFooter] - Opcional. Recebe (data) e retorna conteúdo para o rodapé do card (ex.: metodologia da projeção).
 */
function ChartCard({ title, objective, endpoint, buildConfig, chartType = 'line', refreshMs = 60000, initialDelay = 0, renderFooter }) {
  const { data, status, lastUpdated, error, refresh, isLoading } = useApiData(endpoint, refreshMs, initialDelay);

  const renderChart = () => {
    if (error) {
      return (
        <div className="chart-error">
          Erro ao carregar dados: {error.message}
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="chart-loading">
          {status === 'carregando...' ? 'Carregando dados...' : 'Nenhum dado disponível'}
        </div>
      );
    }

    try {
      const config = buildConfig(data);
      
      if (!config || !config.data) {
        return (
          <div className="chart-loading">
            Configuração inválida
          </div>
        );
      }
      
      switch (chartType) {
        case 'bar':
          return <Bar data={config.data} options={config.options} />;
        case 'pie':
          return <Pie data={config.data} options={config.options} />;
        case 'scatter':
          return <Scatter data={config.data} options={config.options} />;
        case 'line':
        default:
          return <Line data={config.data} options={config.options} />;
      }
    } catch (err) {
      console.error(`Erro ao renderizar gráfico ${title}:`, err);
      return (
        <div className="chart-error">
          Erro ao renderizar gráfico: {err.message}
        </div>
      );
    }
  };

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
      <div className="chart-container">
        {renderChart()}
      </div>
      <div className="status">
        {status}
        {lastUpdated ? ` • atualizado: ${lastUpdated.toLocaleTimeString('pt-BR')}` : ''}
      </div>
      {renderFooter && data && data.length > 0 && (
        <div className="chart-card-footer">
          {renderFooter(data)}
        </div>
      )}
    </div>
  );
}

export default ChartCard;

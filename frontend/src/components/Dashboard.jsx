import React, { useMemo, useState, useEffect } from 'react';
import ChartCard from './ChartCard';
import TableCard from './TableCard';
import MaterialFilterText from './MaterialFilterText';
import InfoCard from './InfoCard';
import { useApiData } from '../hooks/useApiData';
import { CHART_COLORS } from '../utils/constants';
import { formatMesAno, formatNumber } from '../utils/formatters';
import { preloadData } from '../services/batchApi';
import { fetchJson } from '../services/api';
import './Dashboard.css';

/** Monta query string para endpoints (mat_codigo). */
function buildQueryParams(materialFilter) {
  const p = new URLSearchParams();
  if (materialFilter) p.set('mat_codigo', materialFilter);
  const q = p.toString();
  return q ? `?${q}` : '';
}

// Helper para gerar delays escalonados (evita requisições simultâneas)
let componentIndex = 0;
function getStaggeredDelay() {
  const delay = componentIndex * 150; // 150ms entre cada componente
  componentIndex++;
  return delay;
}

function Dashboard() {
  const [materialFilter, setMaterialFilter] = useState(null);
  const [materialName, setMaterialName] = useState(null);
  const [setorControleFilter, setSetorControleFilter] = useState('Todos');

  const queryParams = buildQueryParams(materialFilter);
  const mediaEndpoint = `/media-ultimos-6-consumos${queryParams}`;
  const { data: mediaData } = useApiData(mediaEndpoint, 0, 0);
  const mediaUltimos6 = mediaData?.[0]?.media_ultimos_6_consumos;

  // Reset index quando componente monta
  useMemo(() => {
    componentIndex = 0;
  }, []);

  // Quando o filtro muda, invalida o cache dos endpoints afetados para os gráficos refletirem
  useEffect(() => {
    const invalidateFilteredEndpoints = async () => {
      const { requestCache } = await import('../utils/cache.js');
      const suffix = buildQueryParams(materialFilter);
      requestCache.delete('/historico-consumo-mensal' + suffix);
      requestCache.delete('/projecao-mes-atual-filtrado' + suffix);
      requestCache.delete('/media-ultimos-6-consumos' + suffix);
      requestCache.delete('/consumo-por-hospital-almox' + suffix);
      requestCache.delete('/crescimento-abrupto' + suffix);
      requestCache.delete('/consumo-zero-6-meses' + suffix);
      requestCache.delete('/lista-materiais');
    };
    invalidateFilteredEndpoints();
  }, [materialFilter]);

  // Pré-carrega dados críticos quando o filtro muda
  useEffect(() => {
    const preload = async () => {
      try {
        await preloadData(materialFilter);
        if (import.meta.env.DEV) {
          console.log('✅ Dados pré-carregados para filtro:', materialFilter || 'geral');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao pré-carregar dados:', error);
      }
    };
    const timeoutId = setTimeout(preload, 150);
    return () => clearTimeout(timeoutId);
  }, [materialFilter]);

  // Resolve nome do material (nm_material) quando há filtro mas nome ainda está vazio
  useEffect(() => {
    if (!materialFilter || materialName) return;

    let cancelled = false;
    const resolveNomeMaterial = async () => {
      try {
        const res = await fetchJson('/lista-materiais', { useQueue: false, useCache: true });
        const data = res?.data || [];
        const material = data.find(m => m.mat_codigo != null && String(m.mat_codigo) === String(materialFilter));
        if (!cancelled && material) {
          const nome = material.nm_material ?? material.material ?? null;
          setMaterialName(nome);
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Não foi possível resolver nome do material:', e);
        }
      }
    };

    resolveNomeMaterial();
    return () => { cancelled = true; };
  }, [materialFilter, materialName]);

  return (
    <main className="container">
      <section>
        <h2 className="section-title">Histórico e Projeção de Consumo</h2>
        <p className="section-subtitle">
          Visualize o histórico mensal desde 2023 e a projeção do mês atual, com filtro por material.
        </p>

        <div className="dashboard-filters-row">
          <MaterialFilterText
            value={materialFilter}
            onChange={setMaterialFilter}
            onMaterialChange={(payload) => setMaterialName(payload?.material ?? null)}
          />
        </div>
        {materialFilter && (
          <div className="dashboard-filters-active" role="status" aria-live="polite">
            <span className="material-filter-label-code">Código: <strong>{materialFilter}</strong></span>
            {materialName != null && (
              <>
                <span className="material-filter-label-sep"> • </span>
                <span className="material-filter-label-nome">Nome: <strong>{materialName || '—'}</strong></span>
              </>
            )}
          </div>
        )}

        <div className="grid historico-projecao-grid historico-projecao-compact">
          <ChartCard
            key={`historico-${materialFilter || 'all'}`}
            title="Histórico de Consumo"
            objective="Evolução mensal do consumo desde 2023."
            endpoint={`/historico-consumo-mensal${queryParams}`}
            chartType="bar"
            refreshMs={0}
            initialDelay={0}
            buildConfig={(data) => {
              const labels = data.map((d) => formatMesAno(d.mesano));
              return {
                data: {
                  labels,
                  datasets: [
                    {
                      label: 'Consumo Mensal',
                      data: data.map((d) => d.consumo_mensal || 0),
                      backgroundColor: '#16a34a', // Verde
                      borderColor: '#15803d',
                      borderWidth: 1,
                    },
                  ],
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const value = context.parsed.y;
                          return `Consumo: ${new Intl.NumberFormat('pt-BR').format(value)}`;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return new Intl.NumberFormat('pt-BR', {
                            notation: 'compact',
                            maximumFractionDigits: 1,
                          }).format(value);
                        },
                      },
                    },
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                      },
                    },
                  },
                },
              };
            }}
          />

          <ChartCard
            key={`projecao-${materialFilter || 'all'}`}
            title="Projeção de Consumo do Mês Atual"
            objective="Antecipar o consumo projetado até o fim do mês."
            endpoint={`/projecao-mes-atual-filtrado${queryParams}`}
            chartType="bar"
            refreshMs={0}
            initialDelay={0}
            buildConfig={(data) => {
              // Projetado = média diária (consumo até hoje / dias decorridos) * dias do mês (backend).
              // Variação % = (projetado - média dos últimos 6 meses) / média dos últimos 6 meses * 100.
              const row = data[0];
              const projetado = Number(row?.consumo_projetado_mes) ?? 0;
              const ateHoje = Number(row?.consumo_ate_hoje) ?? 0;
              const media = Number(mediaUltimos6) ?? 0;
              const diasDecorridos = row?.dias_decorridos;
              const diasNoMes = row?.dias_no_mes;
              let labelProjetado = 'Projetado';
              if (media > 0) {
                const pct = ((projetado - media) / media) * 100;
                const formatted = Math.abs(pct).toFixed(1).replace('.', ',');
                labelProjetado = pct >= 0 ? `Projetado (▲ ${formatted}%)` : `Projetado (▼ ${formatted}%)`;
              }
              return {
                data: {
                  labels: ['Até hoje', labelProjetado],
                  datasets: [
                    {
                      label: 'Consumo',
                      data: [ateHoje, projetado],
                      backgroundColor: [CHART_COLORS[2], CHART_COLORS[3]],
                    },
                  ],
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const value = context.parsed.y;
                          return `Consumo: ${new Intl.NumberFormat('pt-BR').format(value)}`;
                        },
                        afterBody: function() {
                          if (diasDecorridos == null || diasNoMes == null) return [];
                          return [
                            '',
                            'Projeção = média diária × dias do mês.',
                            `${diasDecorridos} dias decorridos de ${diasNoMes} no mês.`,
                          ];
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return new Intl.NumberFormat('pt-BR', {
                            notation: 'compact',
                            maximumFractionDigits: 1,
                          }).format(value);
                        },
                      },
                    },
                  },
                },
              };
            }}
            renderFooter={(data) => {
              const d = data[0];
              const dias = d?.dias_decorridos;
              const total = d?.dias_no_mes;
              if (dias == null || total == null) return null;
              return (
                <>
                  <strong>{dias}</strong> dias decorridos de <strong>{total}</strong> no mês. Projeção = média diária × dias do mês.
                </>
              );
            }}
          />

          <InfoCard
            key={`media-${materialFilter || 'all'}`}
            title="Média dos últimos 6 meses"
            endpoint={`/media-ultimos-6-consumos${queryParams}`}
            formatValue={(value) => formatNumber(value, 1)}
            unit="Média em unidades"
            refreshMs={0}
          />
        </div>
      </section>

      <section>
        <h2 className="section-title">Análises por Unidade</h2>
        <p className="section-subtitle">
          Comparativos entre unidades e localização de gargalos operacionais.
        </p>
        <div className="grid grid-single-full analises-unidade-grid">
          <ChartCard
            key={`hospital-almox-${materialFilter || 'all'}`}
            title="Consumo por Setor Consumidor"
            objective="Média dos últimos 6 meses (anteriores ao mês corrente) por centro requisitante, em ordem decrescente. Apenas movimento_cd = 'RM'."
            endpoint={`/consumo-por-hospital-almox${queryParams}`}
            chartType="bar"
            refreshMs={0}
            initialDelay={getStaggeredDelay()}
            buildConfig={(data) => {
              const sorted = [...data].sort((a, b) => {
                const va = Number(a.media_consumo_6_meses) || 0;
                const vb = Number(b.media_consumo_6_meses) || 0;
                return vb - va;
              });
              const top = sorted.slice(0, 20);
              return {
                data: {
                  labels: top.map((d) => d.centro_requisitante ?? '—'),
                  datasets: [
                    {
                      label: 'Média consumo (6 meses)',
                      data: top.map((d) => Number(d.media_consumo_6_meses) || 0),
                      backgroundColor: CHART_COLORS[6],
                    },
                  ],
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) =>
                          `Média 6 meses: ${new Intl.NumberFormat('pt-BR').format(ctx.parsed.x)}`,
                      },
                    },
                  },
                },
              };
            }}
          />
        </div>
      </section>

      <section>
        <h2 className="section-title">Alertas e Monitoramento</h2>
        <p className="section-subtitle">
          Itens críticos e pontos fora do padrão esperado.
        </p>
        <div className="grid">
          <div className="dashboard-table-with-setor-filter">
            <div className="dashboard-setor-filtro-row" role="group" aria-label="Filtrar por setor de controle">
              <label htmlFor="setor-controle-select" className="dashboard-setor-filtro-label">
                Setor de controle
              </label>
              <select
                id="setor-controle-select"
                className="dashboard-setor-filtro-select"
                value={setorControleFilter}
                onChange={(e) => setSetorControleFilter(e.target.value)}
                aria-describedby="setor-controle-desc"
              >
                <option value="Todos">Todos</option>
                <option value="UACE">UACE</option>
                <option value="ULOG">ULOG</option>
              </select>
              <span id="setor-controle-desc" className="dashboard-setor-filtro-desc">
                Filtra a tabela pela coluna setor_controle (merge com ctrl.safs_catalogo).
              </span>
            </div>
            <TableCard
              key={`crescimento-abrupto-${setorControleFilter}`}
              title="Materiais com crescimento abrupto"
              objective="Monitorar aumentos acima de 30%. Mês anterior = consolidado; mês atual = parcial (até hoje). % = variação entre atual e anterior. Coluna setor_controle via merge com ctrl.safs_catalogo."
              endpoint={`/crescimento-abrupto${queryParams}${setorControleFilter && setorControleFilter !== 'Todos' ? (queryParams ? '&' : '?') + 'setor=' + encodeURIComponent(setorControleFilter) : ''}`}
              periodFromData={{ mesAtualKey: 'mes_atual' }}
              columns={[
                { key: 'material', label: 'Material' },
                { key: 'setor_controle', label: 'Setor controle' },
                { key: 'consumo_mes_anterior', label: 'Mês anterior' },
                { key: 'consumo_mes_atual', label: 'Mês atual' },
                { key: 'crescimento_percentual', label: '% Cresc.' },
              ]}
              maxRows={15}
              enableViewAll
              enablePdfExport
              refreshMs={0}
              initialDelay={getStaggeredDelay()}
            />
          </div>

          <TableCard
            key="consumo-zero-6"
            title="Materiais sem consumo recente"
            objective="Detectar obsolescência ou inconsistências cadastrais. Dados a partir de 2023; ordenado pelos que estão há mais tempo sem consumo."
            endpoint={`/consumo-zero-6-meses${queryParams}`}
            columns={[
              { key: 'material', label: 'Material' },
              { key: 'ultimo_mes_consumo', label: 'Último mês' },
              { key: 'consumo_ultimo_mes', label: 'Consumo no último mês' },
            ]}
            maxRows={15}
            enableViewAll
            enablePdfExport
            refreshMs={0}
            initialDelay={getStaggeredDelay()}
          />
        </div>
      </section>

      <section className="info">
        <div className="card">
          <h3>Legenda analítica</h3>
          <p>
            Cada visualização foi alinhada a um objetivo específico para facilitar
            a tomada de decisão. O painel atualiza automaticamente com base na
            periodicidade configurada no frontend.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;

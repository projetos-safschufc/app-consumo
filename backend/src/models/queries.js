/**
 * Modelo de queries SQL
 * Centraliza todas as consultas SQL do sistema
 */

export const SQL_QUERIES = {
  projecao_mes_atual: `
    -- Projeção mensal: média diária = consumo até hoje / dias decorridos no mês; projetado = média diária * dias do mês.
    WITH consumo_parcial AS (
      SELECT
        SUM(CASE 
          WHEN quantidade::text ~ '^-?\\d+$' THEN 
            ABS(quantidade::integer)
          ELSE 0 
        END) AS consumo_ate_hoje
      FROM gad_dlih_safs.v_df_movimento
      WHERE movimento_cd = 'RM'
        AND date_trunc('month', data) = date_trunc('month', CURRENT_DATE)
    ),
    dias_ref AS (
      SELECT
        EXTRACT(DAY FROM CURRENT_DATE)::integer AS dias_decorridos,
        EXTRACT(DAY FROM (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'))::integer AS dias_no_mes
    )
    SELECT
      c.consumo_ate_hoje,
      d.dias_decorridos,
      d.dias_no_mes,
      ROUND(
        (c.consumo_ate_hoje::numeric / NULLIF(d.dias_decorridos, 0)) * d.dias_no_mes,
        2
      )::numeric AS consumo_projetado_mes
    FROM consumo_parcial c
    CROSS JOIN dias_ref d;
  `,

  crescimento_abrupto: `
    -- Materiais com crescimento ABRUPTO (> 30%) na comparação mês anterior (consolidado) x mês atual (parcial).
    -- Fonte: gad_dlih_safs.v_df_movimento, movimento_cd = 'RM'.
    -- Agregação por mat_codigo (mesmo critério do Histórico de Consumo e extração Excel), garantindo coerência.
    --
    -- Semântica:
    --   consumo_mes_anterior = valores CONSOLIDADOS do mês anterior (ex.: 12/2025 = mês fechado).
    --   consumo_mes_atual    = valores PARCIAIS do mês atual (ex.: 01/2026 = apurado até a data atual).
    --   crescimento_percentual = ((consumo_mes_atual - consumo_mes_anterior) / consumo_mes_anterior) * 100
    --   Divisão em numeric para precisão; NULLIF(anterior, 0) evita divisão por zero.
    WITH mes_atual_ref AS (
      SELECT date_trunc('month', CURRENT_DATE)::date AS mes_atual
    ),
    consumo_mensal AS (
      SELECT
        date_trunc('month', mesano)::date AS mesano,
        mat_codigo,
        MAX(mat_codigo::text || '-' || COALESCE(TRIM(nm_material), TRIM(material), '')) AS material,
        SUM(CASE
          WHEN quantidade::text ~ '^-?\\d+$' THEN
            ABS(quantidade::integer)
          ELSE 0
        END) AS consumo
      FROM gad_dlih_safs.v_df_movimento
      WHERE movimento_cd = 'RM'
        AND mat_codigo IS NOT NULL
      GROUP BY date_trunc('month', mesano), mat_codigo
    )
    SELECT
      atual.mesano AS mes_atual,
      atual.mat_codigo,
      atual.material,
      anterior.consumo AS consumo_mes_anterior,
      atual.consumo AS consumo_mes_atual,
      (ROUND(
        ((atual.consumo - anterior.consumo)::numeric / NULLIF(anterior.consumo, 0)) * 100,
        2
      ))::numeric AS crescimento_percentual
    FROM consumo_mensal atual
    JOIN consumo_mensal anterior
      ON atual.mat_codigo = anterior.mat_codigo
     AND atual.mesano = (anterior.mesano + INTERVAL '1 month')::date
    CROSS JOIN mes_atual_ref m
    WHERE atual.mesano = m.mes_atual
      AND ((atual.consumo - anterior.consumo)::numeric / NULLIF(anterior.consumo, 0)) > 0.30
    ORDER BY crescimento_percentual DESC;
  `,

  consumo_zero_6_meses: `
    -- Materiais cujo último consumo (a partir de 2023) foi há mais de 6 meses. Ordenado pelos que estão há mais tempo sem consumo.
    -- Fonte: gad_dlih_safs.v_df_movimento, movimento_cd = 'RM', apenas mesano >= '2023-01-01' (ignora 2022).
    WITH base_2023 AS (
      SELECT
        id_material,
        material,
        date_trunc('month', mesano)::date AS mesano,
        SUM(CASE
          WHEN quantidade::text ~ '^-?\\d+$' THEN ABS(quantidade::integer)
          ELSE 0
        END) AS consumo_no_mes
      FROM gad_dlih_safs.v_df_movimento
      WHERE movimento_cd = 'RM'
        AND mesano >= '2023-01-01'
      GROUP BY id_material, material, date_trunc('month', mesano)
    ),
    ultimos_meses AS (
      SELECT
        id_material,
        material,
        MAX(mesano) AS ultimo_mes_consumo
      FROM base_2023
      GROUP BY id_material, material
    )
    SELECT
      u.id_material,
      u.material,
      u.ultimo_mes_consumo,
      b.consumo_no_mes AS consumo_ultimo_mes
    FROM ultimos_meses u
    JOIN base_2023 b
      ON u.id_material = b.id_material
     AND u.material = b.material
     AND u.ultimo_mes_consumo = b.mesano
    WHERE u.ultimo_mes_consumo < (date_trunc('month', CURRENT_DATE) - INTERVAL '6 months')
    ORDER BY u.ultimo_mes_consumo ASC;
  `,

  consumo_por_hospital_almox: `
    -- Média aritmética dos 6 últimos meses (anteriores ao mês corrente) por centro requisitante.
    -- Apenas movimento_cd = 'RM'. Filtro opcional por mat_codigo. Ordem decrescente por consumo.
    WITH ultimos_6_meses AS (
      SELECT (date_trunc('month', CURRENT_DATE) - (n || ' months')::interval)::date AS mesano
      FROM generate_series(1, 6) AS n
    ),
    consumo_mensal_por_centro AS (
      SELECT
        v.centro_requisitante,
        date_trunc('month', v.mesano)::date AS mesano,
        SUM(CASE
          WHEN v.quantidade::text ~ '^-?\\d+$' THEN ABS(v.quantidade::integer)
          ELSE 0
        END) AS consumo_mensal
      FROM gad_dlih_safs.v_df_movimento v
      WHERE v.movimento_cd = 'RM'
        AND v.mesano >= (SELECT MIN(mesano) FROM ultimos_6_meses)
        AND v.mesano < date_trunc('month', CURRENT_DATE)::date
        AND v.centro_requisitante IS NOT NULL
        AND TRIM(v.centro_requisitante) <> ''
        {{FILTER_MATERIAL}}
      GROUP BY v.centro_requisitante, date_trunc('month', v.mesano)
    )
    SELECT
      centro_requisitante,
      ROUND((COALESCE(SUM(consumo_mensal), 0) / 6.0)::numeric, 2) AS media_consumo_6_meses
    FROM consumo_mensal_por_centro
    GROUP BY centro_requisitante
    ORDER BY media_consumo_6_meses DESC;
  `,

  ranking_materiais_criticos: `
    WITH consumo_mensal AS (
      SELECT
        mesano,
        id_material,
        material,
        SUM(CASE 
          WHEN quantidade::text ~ '^-?\\d+$' THEN 
            ABS(quantidade::integer)
          ELSE 0 
        END) AS consumo
      FROM gad_dlih_safs.v_df_movimento
      WHERE movimento_cd = 'RM'
      GROUP BY mesano, id_material, material
    )
    SELECT
      id_material,
      material,
      AVG(consumo) AS media_mensal_consumo
    FROM consumo_mensal
    GROUP BY id_material, material
    ORDER BY media_mensal_consumo DESC
    FETCH FIRST 20 ROWS ONLY;
  `,

  consumo_x_valor: `
    SELECT
      id_material,
      material,
      SUM(CASE 
        WHEN quantidade::text ~ '^-?\\d+$' THEN 
          ABS(quantidade::integer)
        ELSE 0 
      END) AS consumo_total,
      SUM(valor_orig) AS valor_total,
      ROUND(
        (SUM(valor_orig) / NULLIF(SUM(CASE 
          WHEN quantidade::text ~ '^-?\\d+$' THEN 
            ABS(quantidade::integer)
          ELSE 0 
        END), 0))::numeric,
        2
      ) AS custo_unitario_medio
    FROM gad_dlih_safs.v_df_movimento
    WHERE movimento_cd = 'RM'
    GROUP BY id_material, material
    ORDER BY valor_total DESC;
  `,

  historico_consumo_mensal: `
    -- Histórico de consumo mensal filtrado por df_movimento.mat_codigo
    SELECT
      mesano,
      SUM(CASE 
        WHEN quantidade::text ~ '^-?\\d+$' THEN 
          ABS(quantidade::integer)
        ELSE 0 
      END) AS consumo_mensal
    FROM gad_dlih_safs.v_df_movimento
    WHERE movimento_cd = 'RM'
      AND mesano >= '2023-01-01'
      {{FILTER_MATERIAL}} -- Filtro por mat_codigo (coluna df_movimento.mat_codigo)
    GROUP BY mesano
    ORDER BY mesano;
  `,

  projecao_mes_atual_filtrado: `
    -- Projeção do mês atual filtrado por df_movimento.mat_codigo.
    -- Metodologia: média diária = consumo até hoje / dias decorridos no mês; projetado = média diária * dias do mês.
    WITH consumo_parcial AS (
      SELECT
        SUM(CASE 
          WHEN quantidade::text ~ '^-?\\d+$' THEN 
            ABS(quantidade::integer)
          ELSE 0 
        END) AS consumo_ate_hoje
      FROM gad_dlih_safs.v_df_movimento
      WHERE movimento_cd = 'RM'
        AND date_trunc('month', data) = date_trunc('month', CURRENT_DATE)
        {{FILTER_MATERIAL}} -- Filtro por mat_codigo (coluna df_movimento.mat_codigo)
    ),
    dias_ref AS (
      SELECT
        EXTRACT(DAY FROM CURRENT_DATE)::integer AS dias_decorridos,
        EXTRACT(DAY FROM (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'))::integer AS dias_no_mes
    )
    SELECT
      c.consumo_ate_hoje,
      d.dias_decorridos,
      d.dias_no_mes,
      ROUND(
        (c.consumo_ate_hoje::numeric / NULLIF(d.dias_decorridos, 0)) * d.dias_no_mes,
        2
      )::numeric AS consumo_projetado_mes
    FROM consumo_parcial c
    CROSS JOIN dias_ref d;
  `,

  lista_materiais: `
    -- Lista de materiais: mat_codigo e nm_material (evita SELECT DISTINCT + ORDER BY fora da lista)
    SELECT
      mat_codigo,
      material,
      nm_material
    FROM gad_dlih_safs.v_df_movimento
    WHERE movimento_cd = 'RM'
      AND mat_codigo IS NOT NULL
      AND (material IS NOT NULL OR nm_material IS NOT NULL)
    GROUP BY mat_codigo, material, nm_material
    ORDER BY COALESCE(nm_material, material)    
  `,

  media_ultimos_6_consumos: `
    -- Média aritmética dos últimos 6 consumos mensais filtrado por df_movimento.mat_codigo
    -- Calcula: (consumo_mes1 + consumo_mes2 + ... + consumo_mes6) / 6
    SELECT
      COALESCE(AVG(consumo_mensal), 0) AS media_ultimos_6_consumos
    FROM (
      SELECT
        mesano,
        SUM(CASE 
          WHEN quantidade::text ~ '^-?\\d+$' THEN 
            ABS(quantidade::integer)
          ELSE 0 
        END) AS consumo_mensal
      FROM gad_dlih_safs.v_df_movimento
      WHERE movimento_cd = 'RM'
        AND mesano >= '2023-01-01'
        {{FILTER_MATERIAL}} -- Filtro por mat_codigo (coluna df_movimento.mat_codigo)
      GROUP BY mesano
      ORDER BY mesano DESC
      LIMIT 6
    ) AS ultimos_6;
  `,
};

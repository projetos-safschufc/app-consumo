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
    -- Materiais com crescimento ABRUPTO (> 30%). Código único = trecho à esquerda do '-' em mat_cod_antigo.
    -- Fonte: gad_dlih_safs.v_df_movimento, movimento_cd = 'RM'.
    WITH mes_atual_ref AS (
      SELECT date_trunc('month', CURRENT_DATE)::date AS mes_atual
    ),
    consumo_mensal AS (
      SELECT
        date_trunc('month', mesano)::date AS mesano,
        TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1)) AS codigo_unico,
        MAX(COALESCE(TRIM(mat_cod_antigo), TRIM(material), '')) AS material,
        SUM(CASE
          WHEN quantidade::text ~ '^-?\\d+$' THEN
            ABS(quantidade::integer)
          ELSE 0
        END) AS consumo
      FROM gad_dlih_safs.v_df_movimento
      WHERE movimento_cd = 'RM'
        AND TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1)) <> ''
      GROUP BY date_trunc('month', mesano), TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1))
    )
    SELECT
      atual.mesano AS mes_atual,
      atual.codigo_unico AS mat_codigo,
      atual.material,
      anterior.consumo AS consumo_mes_anterior,
      atual.consumo AS consumo_mes_atual,
      (ROUND(
        ((atual.consumo - anterior.consumo)::numeric / NULLIF(anterior.consumo, 0)) * 100,
        2
      ))::numeric AS crescimento_percentual
    FROM consumo_mensal atual
    JOIN consumo_mensal anterior
      ON atual.codigo_unico = anterior.codigo_unico
     AND atual.mesano = (anterior.mesano + INTERVAL '1 month')::date
    CROSS JOIN mes_atual_ref m
    WHERE atual.mesano = m.mes_atual
      AND ((atual.consumo - anterior.consumo)::numeric / NULLIF(anterior.consumo, 0)) > 0.30
    ORDER BY crescimento_percentual DESC;
  `,

  consumo_zero_6_meses: `
    -- Materiais cujo último consumo (a partir de 2023) foi há mais de 6 meses. Código único = trecho à esquerda do '-' em mat_cod_antigo.
    WITH base_2023 AS (
      SELECT
        TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1)) AS codigo_unico,
        MAX(COALESCE(TRIM(mat_cod_antigo), TRIM(material), '')) AS material,
        date_trunc('month', mesano)::date AS mesano,
        SUM(CASE
          WHEN quantidade::text ~ '^-?\\d+$' THEN ABS(quantidade::integer)
          ELSE 0
        END) AS consumo_no_mes
      FROM gad_dlih_safs.v_df_movimento
      WHERE movimento_cd = 'RM'
        AND mesano >= '2023-01-01'
        AND TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1)) <> ''
      GROUP BY TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1)), date_trunc('month', mesano)
    ),
    ultimos_meses AS (
      SELECT
        codigo_unico,
        material,
        MAX(mesano) AS ultimo_mes_consumo
      FROM base_2023
      GROUP BY codigo_unico, material
    )
    SELECT
      u.codigo_unico AS id_material,
      u.material,
      u.ultimo_mes_consumo,
      b.consumo_no_mes AS consumo_ultimo_mes
    FROM ultimos_meses u
    JOIN base_2023 b
      ON u.codigo_unico = b.codigo_unico
     AND u.material = b.material
     AND u.ultimo_mes_consumo = b.mesano
    WHERE u.ultimo_mes_consumo < (date_trunc('month', CURRENT_DATE) - INTERVAL '6 months')
    ORDER BY u.ultimo_mes_consumo ASC;
  `,

  consumo_por_hospital_almox: `
    -- Média aritmética dos 6 últimos meses (anteriores ao mês corrente) por centro requisitante.
    -- Apenas movimento_cd = 'RM'. Filtro opcional por código único (mat_cod_antigo antes do '-'). Ordem decrescente por consumo.
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
    -- Histórico de consumo mensal. Filtro por código único (trecho à esquerda do '-' em mat_cod_antigo).
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
      {{FILTER_MATERIAL}}
    GROUP BY mesano
    ORDER BY mesano;
  `,

  projecao_mes_atual_filtrado: `
    -- Projeção do mês atual. Filtro por código único (mat_cod_antigo antes do '-').
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
        {{FILTER_MATERIAL}}
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
    -- Lista de materiais. Código único = trecho à esquerda do '-' em mat_cod_antigo (identificador único por produto).
    SELECT
      TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1)) AS mat_codigo,
      MAX(COALESCE(nm_material, mat_cod_antigo, material)) AS material,
      MAX(nm_material) AS nm_material
    FROM gad_dlih_safs.v_df_movimento
    WHERE movimento_cd = 'RM'
      AND TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1)) <> ''
      AND (mat_cod_antigo IS NOT NULL OR material IS NOT NULL OR nm_material IS NOT NULL)
    GROUP BY TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1))
    ORDER BY MAX(COALESCE(nm_material, mat_cod_antigo, material));
  `,

  media_ultimos_6_consumos: `
    -- Média aritmética dos últimos 6 consumos mensais (exclui o mês atual). Filtro por código único (mat_cod_antigo antes do '-').
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
        AND mesano < date_trunc('month', CURRENT_DATE)::date
        {{FILTER_MATERIAL}}
      GROUP BY mesano
      ORDER BY mesano DESC
      LIMIT 6
    ) AS ultimos_6;
  `,
};

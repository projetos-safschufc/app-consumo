# Tutorial — Painel de Consumo de Materiais (Passo a Passo)

Este guia ensina a usar o painel em formato de **tutorial**: cada seção traz passos numerados para você seguir na ordem. Indicado para quem está usando o sistema pela primeira vez.

---

## O que você vai aprender

- Acessar o painel e entender a tela.
- Filtrar por material para ver dados gerais ou de um item específico.
- Ler o histórico e a projeção de consumo.
- Usar as análises por unidade e os alertas.

---

# PARTE 1 — Primeiro acesso

## Passo 1.1 — Abrir o painel

1. No navegador (Chrome, Edge, Firefox etc.), digite o endereço do painel que sua instituição informou (ex.: `http://10.28.0.124:4173/` ou o link do sistema).
2. Pressione **Enter**.
3. Aguarde a página carregar completamente.

**O que você deve ver:** a tela do painel com o título **"Histórico e Projeção de Consumo"** no topo e, abaixo, um campo de texto **"Filtrar por Material"**.

---

## Passo 1.2 — Verificar se o sistema está conectado

**Objetivo deste elemento:** Informar se o painel está conectado ao servidor de dados — verde = conectado; vermelho = sem conexão. Assim você sabe se os números exibidos são confiáveis antes de analisar.

1. Olhe para o **topo da página**, logo abaixo do cabeçalho.
2. Verifique a mensagem exibida:
   - **Verde** — "Dados consolidados para acompanhamento..." → sistema conectado; você pode seguir o tutorial.
   - **Vermelho** — "Não foi possível conectar ao backend..." → há problema de conexão.

**Se aparecer o aviso vermelho:**

- Confirme se está na rede correta (ex.: rede da empresa).
- Tente recarregar a página (tecla **F5**).
- Se continuar, entre em contato com o suporte de TI.

**Se aparecer o aviso verde:** prossiga para o Passo 2.1.

---

# PARTE 2 — Filtro por material

**Objetivo do filtro:** Definir se você vê **todos os materiais** (visão geral consolidada) ou **apenas um material** (análise específica). Todos os gráficos, cards e tabelas da página respeitam esse filtro.

## Passo 2.1 — Ver o total geral (todos os materiais)

1. Localize o campo **"Filtrar por Material"** (logo abaixo do subtítulo da primeira seção).
2. Certifique-se de que o campo está **vazio** (sem código e sem nome).
3. Se houver algum texto, apague tudo e deixe o campo em branco.
4. Aguarde alguns segundos — os gráficos e tabelas serão atualizados automaticamente.

**Resultado:** todos os blocos da tela passam a mostrar dados **consolidados de todos os materiais**. Use essa visão para ter uma visão geral do consumo.

---

## Passo 2.2 — Filtrar por código do material

1. No campo **"Filtrar por Material"**, digite **apenas o número** (código) do material (ex.: `12345`).
2. Aguarde a atualização — o sistema aplica o filtro sozinho.
3. Confira se apareceu logo abaixo do campo uma linha em destaque com **Código:** e **Nome:** do material.

**Resultado:** histórico, projeção, média, análises por unidade e alertas passam a considerar **somente esse material**.

---

## Passo 2.3 — Filtrar por nome do material

1. No campo **"Filtrar por Material"**, comece a digitar o **nome** (ou parte do nome) do material.
2. Aguarde a lista de sugestões aparecer.
3. Clique no material desejado na lista.
4. Confira se a linha em destaque (Código e Nome) foi preenchida.

**Resultado:** a tela mostra apenas os dados daquele material, como no Passo 2.2.

**Para voltar ao total geral:** apague o texto do campo e deixe-o em branco (igual ao Passo 2.1).

---

# PARTE 3 — Histórico e projeção de consumo

Nesta parte você aprende a **ler** os três blocos da primeira seção. Cada um tem um **objetivo** claro para apoiar sua decisão.

## Passo 3.1 — Gráfico "Histórico de Consumo"

**Objetivo deste elemento:** Evolução mensal do consumo desde 2023 — para você acompanhar se o consumo está subindo, caindo ou estável ao longo do tempo.

1. Role a tela até o primeiro card à esquerda: **"Histórico de Consumo"**.
2. Veja o gráfico de **barras verticais**.
3. Entenda:
   - **Cada barra** = um mês.
   - **Altura da barra** = quantidade consumida naquele mês.
   - O eixo horizontal mostra os meses (desde 2023); o vertical mostra as quantidades.

**Uso prático:** use esse gráfico para analisar tendências e planejar compras com base no histórico.

---

## Passo 3.2 — Gráfico "Projeção de Consumo do Mês Atual"

**Objetivo deste elemento:** Antecipar o consumo projetado até o fim do mês — para você se preparar com estoque e compras antes que o mês feche.

1. No mesmo bloco da tela, localize o card **"Projeção de Consumo do Mês Atual"** (ao lado do histórico).
2. Veja o gráfico com **duas barras**:
   - **"Até hoje"** — o que já foi consumido no mês até o dia de hoje.
   - **"Projetado"** — estimativa do consumo até o **fim do mês** (média diária × total de dias do mês).
3. Se aparecer um percentual (▲ ou ▼) ao lado de "Projetado", isso indica se a projeção está acima ou abaixo da média dos últimos 6 meses.

**Uso prático:** use essa projeção para planejar compras e estoque; lembre-se de que é uma **estimativa**.

---

## Passo 3.3 — Card "Média dos últimos 6 meses"

**Objetivo deste elemento:** Oferecer uma referência numérica do consumo “normal” recente (média dos últimos 6 meses), para você comparar o mês atual e a projeção com esse padrão.

1. Ainda na mesma linha, localize o card **"Média dos últimos 6 meses"**.
2. Veja o **número** exibido (em unidades).
3. Entenda: esse valor é a **média de consumo** nos últimos seis meses (anteriores ao mês atual).

**Uso prático:** use esse número como base para identificar se o mês está acima ou abaixo do habitual.

---

# PARTE 4 — Análises por unidade

## Passo 4.1 — Gráfico "Consumo por hospital / almoxarifado"

**Objetivo deste elemento:** Mostrar a média dos últimos 6 meses (anteriores ao mês corrente) por centro requisitante (hospital/almoxarifado), em ordem decrescente — para você comparar unidades e localizar onde está o maior consumo e possíveis gargalos operacionais.

1. Role a página até a seção **"Análises por Unidade"**.
2. Localize o gráfico de **barras horizontais** com o título **"Consumo por hospital / almoxarifado"**.
3. Leia da esquerda para a direita:
   - Cada **barra** = um centro requisitante (hospital ou almoxarifado).
   - O **tamanho da barra** = média de consumo dos últimos 6 meses daquela unidade.
4. As unidades aparecem em **ordem decrescente** — as que mais consomem ficam no topo (até 20 unidades).

**Uso prático:** identifique quais hospitais/almoxarifados mais consomem e onde concentrar atenção na gestão de estoque.

---

# PARTE 5 — Alertas e monitoramento

Esta parte ensina a usar as **tabelas de alerta** e o filtro por setor. Cada tabela tem um **objetivo** específico para apoiar o monitoramento de itens críticos.

## Passo 5.1 — Filtrar por setor de controle (opcional)

**Objetivo do filtro:** Restringir a tabela "Materiais com crescimento abrupto" por setor de controle (UACE, ULOG), para você analisar os aumentos por área responsável.

1. Role até a seção **"Alertas e Monitoramento"**.
2. Acima da primeira tabela, localize o campo **"Setor de controle"**.
3. Clique no menu (lista) e escolha:
   - **Todos** — para ver todos os setores.
   - **UACE** — apenas itens do setor UACE.
   - **ULOG** — apenas itens do setor ULOG.

**Importante:** esse filtro altera **somente** a tabela **"Materiais com crescimento abrupto"**. A tabela "Materiais sem consumo recente" não é afetada.

---

## Passo 5.2 — Tabela "Materiais com crescimento abrupto"

**Objetivo deste elemento:** Monitorar materiais com aumento de consumo acima de 30% em relação ao mês anterior — para você antecipar ruptura de estoque e revisar pedidos. O mês anterior é consolidado; o mês atual é parcial (até hoje). A coluna % mostra a variação entre atual e anterior; o setor de controle (UACE/ULOG) ajuda a direcionar a análise.

1. Logo abaixo do filtro de setor, localize a tabela **"Materiais com crescimento abrupto"**.
2. Leia as colunas:
   - **Material** — nome/código do item.
   - **Setor controle** — UACE, ULOG etc.
   - **Mês anterior** — consumo no mês passado (fechado).
   - **Mês atual** — consumo no mês em curso (até hoje).
   - **% Cresc.** — percentual de aumento (acima de 30% entram nessa lista).
3. Use a tabela para identificar itens com **aumento forte** de consumo e planejar reposição ou revisão de pedidos.

**Dica:** se existir botão **"Exportar PDF"**, você pode baixar a tabela para relatórios.

---

## Passo 5.3 — Tabela "Materiais sem consumo recente"

**Objetivo deste elemento:** Detectar obsolescência ou inconsistências cadastrais — materiais que não tiveram consumo nos últimos 6 meses. Os dados consideram o período a partir de 2023; a tabela vem ordenada pelos que estão há mais tempo sem consumo, para você priorizar revisão de estoque e cadastro.

1. Role até a segunda tabela da seção: **"Materiais sem consumo recente"**.
2. Leia as colunas:
   - **Material** — nome/código do item.
   - **Último mês** — último mês em que houve consumo.
   - **Consumo no último mês** — quantidade naquele mês.
3. Os itens que estão **há mais tempo sem consumo** aparecem primeiro.

**Uso prático:** use essa lista para revisar itens possivelmente obsoletos ou com problema de cadastro.

---

# PARTE 6 — Ações rápidas

## Passo 6.1 — Atualizar um bloco específico

1. Em alguns cards (gráficos ou tabelas), há um **ícone de seta circular** no canto superior direito.
2. Clique nesse ícone para **recarregar apenas aquele bloco**, sem atualizar a página inteira.

---

## Passo 6.2 — Exportar tabela em PDF

1. Nas tabelas de alertas, procure o botão de **exportar** ou **PDF** (quando disponível).
2. Clique no botão.
3. Siga a mensagem do navegador para abrir ou salvar o arquivo PDF.

---

## Passo 6.3 — Recarregar a página inteira

1. Se a tela travar ou os dados parecerem desatualizados, pressione **F5** (ou o botão de atualizar do navegador).
2. Aguarde o carregamento e verifique novamente o aviso no topo (verde = conectado).

---

# Resumo do fluxo sugerido

| Ordem | Ação |
|-------|------|
| 1 | Abrir o painel e verificar o aviso de conexão (Passo 1.1 e 1.2). |
| 2 | Deixar o filtro vazio para ver o total geral ou preencher para um material (Passo 2.1 a 2.3). |
| 3 | Ler histórico, projeção e média (Passo 3.1 a 3.3). |
| 4 | Consultar consumo por unidade (Passo 4.1). |
| 5 | (Opcional) Ajustar setor de controle e consultar as tabelas de alertas (Passo 5.1 a 5.3). |
| 6 | Usar atualização por card e exportar PDF quando precisar (Passo 6.1 e 6.2). |

---

# Objetivos por elemento (referência rápida)

| Elemento | Objetivo |
|----------|----------|
| **Aviso no topo (verde/vermelho)** | Informar se o painel está conectado ao servidor; garantir que os dados exibidos são confiáveis. |
| **Filtro por material** | Escolher visão geral (todos) ou análise de um material específico; todos os blocos da tela seguem esse filtro. |
| **Gráfico Histórico de Consumo** | Mostrar a evolução mensal do consumo desde 2023 para acompanhar tendências. |
| **Gráfico Projeção do Mês Atual** | Antecipar o consumo projetado até o fim do mês para planejar compras e estoque. |
| **Card Média dos últimos 6 meses** | Oferecer referência do consumo “normal” recente para comparar com o mês atual e a projeção. |
| **Gráfico Consumo por hospital/almoxarifado** | Comparar unidades pela média dos últimos 6 meses; localizar maiores consumos e gargalos. |
| **Filtro Setor de controle** | Restringir a tabela de crescimento abrupto por setor (UACE/ULOG) para análise por área. |
| **Tabela Materiais com crescimento abrupto** | Monitorar aumentos acima de 30% para evitar ruptura e revisar pedidos; mês anterior consolidado, mês atual parcial. |
| **Tabela Materiais sem consumo recente** | Detectar obsolescência ou inconsistências; itens sem consumo nos últimos 6 meses, ordenados pelos que estão há mais tempo sem consumo. |

---

# Problemas comuns (consulta rápida)

| Situação | O que fazer |
|----------|-------------|
| Aviso vermelho "Não foi possível conectar" | Verificar rede; recarregar (F5); contatar suporte de TI. |
| Dados em branco ou "Erro ao carregar" | Recarregar a página; verificar aviso no topo; contatar suporte se persistir. |
| Material não aparece no filtro | Conferir código ou nome; tentar parte do nome na busca. |
| Dúvida sobre um número exibido | Os dados vêm do sistema de gestão; consultar área responsável ou suporte. |

Para instalação e configuração técnica do sistema, consulte o **README** e a documentação do projeto.

---

*Tutorial para usuários do Painel de Consumo de Materiais — uso passo a passo.*

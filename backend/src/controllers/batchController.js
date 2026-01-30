/**
 * Controller para batch requests
 * Permite buscar múltiplos endpoints em uma única requisição
 * Reduz número de chamadas HTTP e melhora performance
 */

import {
  getHistoricoConsumoMensal,
  getProjecaoMesAtualFiltrado,
  getMediaUltimos6Consumos,
  getListaMateriais,
} from './consumoController.js';

/**
 * Executa múltiplas queries em paralelo
 * @param {Array} requests - Array de objetos { endpoint, params }
 * @returns {Promise<Object>} - Objeto com resultados indexados por endpoint
 */
async function executeBatchRequests(requests) {
  const results = {};
  const promises = [];

  for (const req of requests) {
    const { endpoint, params = {} } = req;
    
    // Cria uma promise para cada request
    const promise = (async () => {
      try {
        let data;
        
        // Cria objetos req/res/next mockados para os controllers
        const mockReq = { query: params };
        let responseData = null;
        const mockRes = {
          json: (payload) => {
            responseData = payload;
            return mockRes;
          },
          status: () => mockRes,
        };
        const mockNext = (error) => {
          if (error) throw error;
        };
        
        // Mapeia endpoints para funções
        switch (endpoint) {
          case 'historico-consumo-mensal':
            await getHistoricoConsumoMensal(mockReq, mockRes, mockNext);
            data = responseData;
            break;
          case 'projecao-mes-atual-filtrado':
            await getProjecaoMesAtualFiltrado(mockReq, mockRes, mockNext);
            data = responseData;
            break;
          case 'media-ultimos-6-consumos':
            await getMediaUltimos6Consumos(mockReq, mockRes, mockNext);
            data = responseData;
            break;
          case 'lista-materiais':
            await getListaMateriais(mockReq, mockRes, mockNext);
            data = responseData;
            break;
          default:
            throw new Error(`Endpoint desconhecido: ${endpoint}`);
        }
        
        return { endpoint, success: true, data };
      } catch (error) {
        return { 
          endpoint, 
          success: false, 
          error: error.message || 'Erro desconhecido' 
        };
      }
    })();
    
    promises.push(promise);
  }

  // Executa todas em paralelo
  const responses = await Promise.all(promises);
  
  // Organiza resultados por endpoint
  responses.forEach(response => {
    results[response.endpoint] = response;
  });

  return results;
}

/**
 * Batch endpoint - busca múltiplos dados em uma requisição
 * POST /api/batch
 * Body: { requests: [{ endpoint: string, params?: object }] }
 */
export async function getBatch(req, res, next) {
  try {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        error: 'Requisição inválida',
        message: 'O campo "requests" deve ser um array não vazio',
        example: {
          requests: [
            { endpoint: 'historico-consumo-mensal', params: { mat_codigo: '123' } },
            { endpoint: 'projecao-mes-atual-filtrado', params: { mat_codigo: '123' } },
          ],
        },
      });
    }

    // Limita a 10 requests por vez para evitar sobrecarga
    if (requests.length > 10) {
      return res.status(400).json({
        error: 'Muitas requisições',
        message: 'Máximo de 10 requests por batch',
      });
    }

    const results = await executeBatchRequests(requests);

    res.json({
      success: true,
      count: requests.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Endpoint para pré-carregar dados críticos
 * GET /api/preload?mat_codigo=xxx
 */
export async function getPreload(req, res, next) {
  try {
    const { mat_codigo } = req.query;
    const params = mat_codigo ? { mat_codigo } : {};

    // Pré-carrega os dados mais usados
    const requests = [
      { endpoint: 'historico-consumo-mensal', params },
      { endpoint: 'projecao-mes-atual-filtrado', params },
      { endpoint: 'media-ultimos-6-consumos', params },
      { endpoint: 'lista-materiais', params: {} },
    ];

    const results = await executeBatchRequests(requests);

    res.json({
      success: true,
      preloaded: Object.keys(results).length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

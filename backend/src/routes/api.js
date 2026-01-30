import express from 'express';
import {
  getProjecaoMesAtual,
  getCrescimentoAbrupto,
  getConsumoZero6Meses,
  getConsumoPorHospitalAlmox,
  getRankingMateriaisCriticos,
  getConsumoXValor,
  getHistoricoConsumoMensal,
  getProjecaoMesAtualFiltrado,
  getListaMateriais,
  getMediaUltimos6Consumos,
} from '../controllers/consumoController.js';
import { getBatch, getPreload } from '../controllers/batchController.js';
import { getHealth, getHealthCheck } from '../controllers/healthController.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { simpleCache } from '../middlewares/cacheMiddleware.js';

const router = express.Router();

// Rota raiz da API - lista endpoints disponíveis
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API do Dashboard de Consumo de Materiais',
    version: '1.0.0',
    endpoints: {
      health: {
        basic: '/api/health',
        withDb: '/api/health/check',
      },
      consumo: {
        projecaoMesAtual: '/api/projecao-mes-atual',
        crescimentoAbrupto: '/api/crescimento-abrupto',
        consumoZero6Meses: '/api/consumo-zero-6-meses',
        porHospitalAlmox: '/api/consumo-por-hospital-almox',
        rankingCriticos: '/api/ranking-materiais-criticos',
        consumoXValor: '/api/consumo-x-valor',
        historicoConsumoMensal: '/api/historico-consumo-mensal',
        projecaoMesAtualFiltrado: '/api/projecao-mes-atual-filtrado',
        listaMateriais: '/api/lista-materiais',
        mediaUltimos6Consumos: '/api/media-ultimos-6-consumos',
        batch: '/api/batch (POST)',
        preload: '/api/preload',
      },
    },
    documentation: 'Consulte README.md para mais informações',
  });
});

// Health check
router.get('/health', getHealth);
router.get('/health/check', getHealthCheck);

// Batch requests e pré-carregamento
router.post('/batch', asyncHandler(getBatch));
router.get('/preload', asyncHandler(getPreload));

// Endpoints de consumo (com cache)
router.get('/projecao-mes-atual', simpleCache(5 * 60 * 1000), asyncHandler(getProjecaoMesAtual));
router.get('/crescimento-abrupto', asyncHandler(getCrescimentoAbrupto));
router.get('/consumo-zero-6-meses', asyncHandler(getConsumoZero6Meses));
router.get('/consumo-por-hospital-almox', asyncHandler(getConsumoPorHospitalAlmox));
router.get('/ranking-materiais-criticos', asyncHandler(getRankingMateriaisCriticos));
router.get('/consumo-x-valor', asyncHandler(getConsumoXValor));
// Endpoints principais com cache otimizado
router.get('/historico-consumo-mensal', simpleCache(10 * 60 * 1000), asyncHandler(getHistoricoConsumoMensal));
router.get('/projecao-mes-atual-filtrado', simpleCache(5 * 60 * 1000), asyncHandler(getProjecaoMesAtualFiltrado));
router.get('/lista-materiais', simpleCache(30 * 60 * 1000), asyncHandler(getListaMateriais));
router.get('/media-ultimos-6-consumos', simpleCache(10 * 60 * 1000), asyncHandler(getMediaUltimos6Consumos));

export default router;

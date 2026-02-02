import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config/app.js';
import { errorHandler } from './middlewares/errorHandler.js';
import apiRoutes from './routes/api.js';

// Valida configuração antes de iniciar
validateConfig();

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem origin (ex: mobile apps, Postman) ou se estiver na lista
    if (!origin || config.cors.origins.includes('*') || config.cors.origins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Rate limiting - Configuração mais permissiva para dashboard
// Permite múltiplos componentes carregando simultaneamente
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (janela menor para reset mais rápido)
  max: 200, // máximo de 200 requisições por minuto por IP
  message: {
    error: 'Muitas requisições',
    message: 'Limite de requisições excedido. Aguarde um momento e tente novamente.',
    retryAfter: '1 minuto',
  },
  standardHeaders: true, // Retorna informações de rate limit nos headers
  legacyHeaders: false,
  // Handler customizado para erro 429
  handler: (req, res) => {
    res.status(429).json({
      error: 'Muitas requisições',
      message: 'Limite de requisições excedido. Aguarde um momento e tente novamente.',
      retryAfter: '1 minuto',
    });
  },
});

// Aplicar rate limiting apenas em rotas que precisam
// Health check não precisa de rate limiting
app.use('/api/health', (req, res, next) => next()); // Pula rate limiting para health
app.use('/api', limiter);

// Rotas
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend ativo. Use /api para acessar os endpoints.',
    health: '/api/health',
  });
});

app.use('/api', apiRoutes);

// Middleware para rotas não encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.path} não existe`,
    availableRoutes: {
      root: '/',
      api: '/api',
      health: '/api/health',
      documentation: 'Consulte /api para ver todos os endpoints disponíveis',
    },
  });
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Inicia o servidor
const PORT = config.app.port;
const HOST = config.app.host;

const server = app.listen(PORT, HOST, async () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`📊 Ambiente: ${config.app.env}`);
  console.log(`🔗 API disponível em http://${HOST}:${PORT}/api`);
  try {
    const { ensureAlertasConsTable } = await import('./config/database.js');
    await ensureAlertasConsTable();
  } catch (err) {
    console.warn('⚠️ Schema/tabela ctrl.alerta_cons:', err.message);
  }
  try {
    const { startAlertasCron } = await import('./jobs/alertasJob.js');
    startAlertasCron();
  } catch (err) {
    console.warn('⚠️ Cron de alertas não iniciado:', err.message);
  }
});

// Tratamento de erros do servidor
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('\n❌ ERRO: Porta já está em uso!');
    console.error(`\n   Porta ${PORT} já está sendo usada por outro processo.`);
    console.error('\n📋 Soluções:');
    console.error(`\n   1. Encerre o processo que está usando a porta ${PORT}:`);
    console.error(`\n      Windows:`);
    console.error(`        netstat -ano | findstr :${PORT}`);
    console.error(`        taskkill /PID <PID> /F`);
    console.error(`\n      Linux/Mac:`);
    console.error(`        lsof -i :${PORT}`);
    console.error(`        kill -9 <PID>`);
    console.error(`\n   2. Ou altere a porta no arquivo backend/.env:`);
    console.error(`      APP_PORT=5001`);
    console.error(`\n   3. Use o script helper:`);
    console.error(`      node scripts/check-port.js ${PORT}`);
    console.error('\n');
    process.exit(1);
  } else {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
  if (config.app.debug) {
    console.error('Stack:', reason?.stack);
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  if (config.app.debug) {
    console.error('Stack:', error.stack);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT recebido, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado.');
    process.exit(0);
  });
});

/**
 * Middleware de tratamento de erros
 * Centraliza o tratamento de erros da aplicação
 */

/**
 * Middleware de tratamento de erros
 */
export function errorHandler(err, req, res, next) {
  console.error('Erro na aplicação:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Erro de banco de dados
  if (err.code && err.code.startsWith('2')) {
    return res.status(503).json({
      error: 'Erro de conexão com o banco de dados',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Serviço temporariamente indisponível',
    });
  }

  if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
    return res.status(503).json({
      error: 'Banco SAFS indisponível',
      message:
        'Não foi possível conectar ao banco de alertas (porta SAFS). Verifique DB_SAFS_HOST, DB_SAFS_PORT ou use DB_SAFS_USE_MAIN_POOL=true no backend/.env.',
    });
  }

  // Erro de query não encontrada
  if (err.message && err.message.includes('não encontrada')) {
    return res.status(404).json({
      error: 'Query não encontrada',
      message: err.message,
    });
  }

  // Erro genérico
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Middleware para capturar erros assíncronos
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

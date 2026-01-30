import React, { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';
import './ApiStatus.css';

/**
 * Componente para verificar status da conexão com a API
 */
function ApiStatus() {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Verificando conexão...');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const checkApi = async () => {
      try {
        setStatus('checking');
        setMessage('Verificando conexão com backend...');
        
        const result = await checkHealth();
        setStatus('connected');
        setMessage('✅ Backend conectado');
        setDetails(result);
      } catch (error) {
        setStatus('error');
        setMessage(`❌ Erro: ${error.message}`);
        setDetails({
          error: error.message,
          suggestion: 'Verifique se o backend está rodando em http://localhost:5001',
        });
      }
    };

    checkApi();
    const interval = setInterval(checkApi, 10000); // Verifica a cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  if (status === 'connected') {
    return null; // Não mostra nada se estiver conectado
  }

  return (
    <div className={`api-status api-status-${status}`}>
      <div className="api-status-content">
        <strong>{message}</strong>
        {details && (
          <div className="api-status-details">
            {details.suggestion && <p>{details.suggestion}</p>}
            {details.timestamp && <p>Última verificação: {new Date(details.timestamp).toLocaleTimeString()}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiStatus;

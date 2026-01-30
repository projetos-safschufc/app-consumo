import { useState, useEffect, useRef } from 'react';
import { fetchJson } from '../services/api';

/**
 * Hook customizado para buscar dados da API com atualização manual ou automática
 * @param {string} endpoint - Endpoint da API
 * @param {number} refreshMs - Intervalo de atualização em milissegundos (0 para desabilitar auto-refresh)
 * @param {number} initialDelay - Delay inicial antes da primeira requisição (ms)
 * @returns {{data: any[], status: string, lastUpdated: Date | null, error: Error | null, refresh: Function, isLoading: boolean}}
 */
export function useApiData(endpoint, refreshMs = 0, initialDelay = 0) {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('carregando...');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef(null);
  const loadFunctionRef = useRef(null);
  
  // Cache local para evitar re-renderizações desnecessárias
  const dataCacheRef = useRef(null);
  const endpointCacheRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    let intervalId = null;
    let initialTimeoutId = null;

    const load = async (isRetry = false, forceRefresh = false) => {
      try {
        setError(null);
        setIsLoading(true);
        if (!isRetry) {
          setStatus('carregando...');
        }
        
        // Se endpoint mudou, sempre limpa cache local
        if (endpointCacheRef.current !== null && endpointCacheRef.current !== endpoint) {
          dataCacheRef.current = null;
        }
        
        // Se não for refresh forçado e endpoint não mudou, verifica cache local primeiro
        if (!forceRefresh && endpointCacheRef.current === endpoint && dataCacheRef.current) {
          setData(dataCacheRef.current);
          setStatus(`registros: ${dataCacheRef.current.length}`);
          setLastUpdated(new Date());
          setIsLoading(false);
          return;
        }
        
        // Se for refresh forçado ou endpoint mudou, limpa cache da API
        if (forceRefresh || endpointCacheRef.current !== endpoint) {
          const { requestCache } = await import('../utils/cache.js');
          requestCache.delete(endpoint);
        }
        
        const payload = await fetchJson(endpoint, { useCache: !forceRefresh });
        
        if (!mountedRef.current) {
          setIsLoading(false);
          return;
        }
        
        const resultData = payload.data || [];
        
        // Atualiza cache local
        dataCacheRef.current = resultData;
        endpointCacheRef.current = endpoint;
        
        setData(resultData);
        setStatus(`registros: ${resultData.length}`);
        setLastUpdated(new Date());
        
        // Limpa qualquer timeout de retry pendente
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      } catch (err) {
        if (!mountedRef.current) {
          setIsLoading(false);
          return;
        }
        
        console.error(`❌ Erro ao carregar ${endpoint}:`, err);
        
        // Tratamento especial para erro 429 (Too Many Requests)
        if (err.status === 429 || err.message.includes('429')) {
          const retryAfter = err.retryAfter || 60; // Default 60 segundos
          const retryMs = retryAfter * 1000;
          
          setStatus(`Aguardando ${retryAfter}s antes de tentar novamente...`);
          
          // Agenda retry automático
          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              load(true);
            }
          }, retryMs);
          
          const friendlyError = new Error(
            `Muitas requisições. Aguardando ${retryAfter} segundos antes de tentar novamente.`
          );
          friendlyError.status = 429;
          friendlyError.retryAfter = retryAfter;
          setError(friendlyError);
        } else {
          // Criar erro mais amigável para outros erros
          const friendlyError = new Error(
            err.message || 'Erro ao carregar dados do servidor'
          );
          friendlyError.originalError = err;
          
          setError(friendlyError);
          setStatus('erro ao carregar');
          setData([]);
        }
      } finally {
        // Sempre define isLoading como false ao finalizar
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Armazena função de load para uso externo
    loadFunctionRef.current = load;

    // Delay inicial escalonado para evitar requisições simultâneas
    if (initialDelay > 0) {
      initialTimeoutId = setTimeout(() => {
        load();
      }, initialDelay);
    } else {
      load();
    }
    
    if (refreshMs > 0) {
      intervalId = setInterval(() => {
        load();
      }, refreshMs);
    }

    return () => {
      mountedRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (initialTimeoutId) {
        clearTimeout(initialTimeoutId);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      loadFunctionRef.current = null;
    };
  }, [endpoint, refreshMs, initialDelay]);
  
  // Limpa cache quando endpoint muda e força reload
  useEffect(() => {
    if (endpointCacheRef.current !== null && endpointCacheRef.current !== endpoint) {
      if (import.meta.env.DEV) {
        console.log(`🔄 Endpoint mudou: ${endpointCacheRef.current} -> ${endpoint}`);
      }
      
      // Limpa cache local quando endpoint muda
      dataCacheRef.current = null;
      
      // Limpa cache da API para forçar nova requisição
      const clearApiCache = async () => {
        const { requestCache } = await import('../utils/cache.js');
        requestCache.delete(endpointCacheRef.current); // Limpa cache do endpoint antigo
        requestCache.delete(endpoint); // Limpa cache do novo endpoint também
      };
      clearApiCache();
      
      // Força reload se o componente ainda estiver montado
      if (mountedRef.current && loadFunctionRef.current) {
        // Pequeno delay para garantir que o cache foi limpo
        setTimeout(() => {
          if (mountedRef.current && loadFunctionRef.current) {
            loadFunctionRef.current(false, true); // forceRefresh = true
          }
        }, 50);
      }
    }
  }, [endpoint]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Função de refresh manual
  const refresh = () => {
    if (loadFunctionRef.current) {
      loadFunctionRef.current(false, true); // forceRefresh = true
    }
  };

  return { data, status, lastUpdated, error, refresh, isLoading };
}

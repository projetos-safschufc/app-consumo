import React, { useState, useEffect, useRef } from 'react';
import { fetchJson } from '../services/api';
import './MaterialFilterText.css';

/** Faixa do tipo int4 no PostgreSQL */
const INT4_MIN = -2147483648;
const INT4_MAX = 2147483647;

/**
 * Parseia e valida valor como df_movimento.mat_codigo (int4).
 * Garante que apenas inteiros válidos na faixa int4 sejam aceitos.
 * @param {string|number|null|undefined} code - Valor do text-box ou da API
 * @returns {{ valid: boolean, value: string|null }} - value é string para uso em query/onChange ou null
 */
function parseMatCodigoInt4(code) {
  if (code == null || code === '' || code === 'null' || code === 'undefined') {
    return { valid: false, value: null };
  }
  const str = String(code).trim();
  if (!str) return { valid: false, value: null };

  let cleaned = str.replace(/[^\d.-]/g, '');
  if (cleaned.startsWith('-')) {
    cleaned = '-' + cleaned.slice(1).replace(/-/g, '');
  } else {
    cleaned = cleaned.replace(/-/g, '');
  }
  if (cleaned === '' || cleaned === '-') return { valid: false, value: null };
  if (cleaned.includes('.')) cleaned = cleaned.split('.')[0];
  if (cleaned === '' || cleaned === '-') return { valid: false, value: null };
  if (!/^-?\d+$/.test(cleaned)) return { valid: false, value: null };

  const num = parseInt(cleaned, 10);
  if (Number.isNaN(num) || !Number.isFinite(num)) return { valid: false, value: null };
  if (num < INT4_MIN || num > INT4_MAX) return { valid: false, value: null };

  return { valid: true, value: String(num) };
}

/**
 * Componente de filtro por material (text-box).
 * O valor do filtro corresponde a df_movimento.mat_codigo (int4).
 * @param {string|number|null} value - Valor atual do filtro (mat_codigo, string ou number)
 * @param {Function} onChange - Callback (recebe mat_codigo como string válida int4 ou null)
 * @param {Function} [onMaterialChange] - Callback com { mat_codigo, material } ou null
 */
function MaterialFilterText({ value, onChange, onMaterialChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);
  const isLoadingMaterialRef = useRef(false);

  /** Normaliza mat_codigo para string (int4): aceita só valor válido ou null. */
  const normalizeMatCodigo = (code) => {
    const { valid, value: v } = parseMatCodigoInt4(code);
    return valid ? v : null;
  };

  // Carrega material selecionado quando value muda externamente
  useEffect(() => {
    const normalizedValue = normalizeMatCodigo(value);
    
    if (normalizedValue && !searchTerm && !isLoadingMaterialRef.current) {
      // Se há um valor mas não há termo de busca, busca o material
      isLoadingMaterialRef.current = true;
      loadMaterialByCode(normalizedValue, false).finally(() => {
        isLoadingMaterialRef.current = false;
      });
    } else if (!normalizedValue) {
      setSelectedMaterial(null);
      setSearchTerm('');
      onMaterialChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // value é a única dependência necessária

  // Busca materiais com debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchTerm.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      // Quando vazio, limpa o filtro (mostra total geral)
      if (value) {
        onChange(null);
        onMaterialChange?.(null);
        setSelectedMaterial(null);
      }
      return;
    }

    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      searchMaterials(searchTerm);
    }, 300); // Debounce de 300ms

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Verifica se o termo de busca é apenas numérico (código)
   * @param {string} term - Termo de busca
   * @returns {boolean} - True se for apenas números
   */
  const isNumericSearch = (term) => {
    return /^\d+$/.test(term.trim());
  };

  /**
   * Busca materiais na lista
   * @param {string} term - Termo de busca (código ou nome)
   */
  const searchMaterials = async (term) => {
    try {
      const payload = await fetchJson('/lista-materiais', { useQueue: false, useCache: true });
      
      if (payload && payload.data && Array.isArray(payload.data)) {
        const searchLower = term.toLowerCase().trim();
        const isNumeric = isNumericSearch(term);
        
        const filtered = payload.data
          .filter(m => {
            // mat_codigo é INTEGER (int4) no banco, converte para string para busca
            const matCodigo = m.mat_codigo;
            const codeStr = matCodigo != null ? String(matCodigo) : '';
            const name = String(m.nm_material || m.material || '').toLowerCase();
            
            // Se busca for numérica, prioriza busca por código
            if (isNumeric) {
              return codeStr.includes(searchLower);
            }
            
            // Busca tanto no código quanto no nome
            return codeStr.toLowerCase().includes(searchLower) || 
                   name.includes(searchLower);
          })
          .slice(0, 10); // Limita a 10 sugestões
        
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } catch (err) {
      console.error('Erro ao buscar materiais:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega material pelo código (mat_codigo INTEGER)
   * @param {string|number} code - Código do material
   * @param {boolean} applyFilter - Se true, aplica o filtro mesmo se material não for encontrado
   * @returns {Promise<Object|null>} - Material encontrado ou null
   */
  const loadMaterialByCode = async (code, applyFilter = false) => {
    try {
      const codeStr = normalizeMatCodigo(code);
      if (!codeStr) {
        setSelectedMaterial(null);
        setSearchTerm('');
        return null;
      }
      
      const payload = await fetchJson('/lista-materiais', { useQueue: false, useCache: true });
      
      if (payload && payload.data && Array.isArray(payload.data)) {
        // Busca material comparando mat_codigo (INTEGER) como string
        // mat_codigo vem do banco como INTEGER, mas comparamos como string
        const material = payload.data.find(m => {
          const matCodigo = m.mat_codigo;
          // Compara convertendo ambos para string (mat_codigo é INTEGER no banco)
          return matCodigo != null && String(matCodigo) === codeStr;
        });
        
        if (material) {
          setSelectedMaterial(material);
          const matCodigoStr = String(material.mat_codigo);
          const nomeMaterial = material.nm_material ?? material.material;
          setSearchTerm(`${matCodigoStr} - ${nomeMaterial}`);
          if (applyFilter) onChange(matCodigoStr);
          onMaterialChange?.({ mat_codigo: matCodigoStr, material: nomeMaterial });
          return material;
        } else {
          setSelectedMaterial(null);
          if (applyFilter && isNumericSearch(codeStr)) {
            setSearchTerm(codeStr);
            onChange(codeStr);
            onMaterialChange?.({ mat_codigo: codeStr, material: null });
            return null;
          }
          onMaterialChange?.(null);
          
          // Se for numérico, mantém o código; senão, limpa
          if (isNumericSearch(codeStr)) {
            setSearchTerm(codeStr);
          } else {
            setSearchTerm('');
          }
          return null;
        }
      }
      return null;
    } catch (err) {
      console.error('Erro ao carregar material:', err);
      setSelectedMaterial(null);
      return null;
    }
  };

  /**
   * Manipula mudança no input de busca
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de mudança
   */
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // Se limpar o campo, remove o filtro e limpa seleção
    if (newValue.length === 0) {
      onChange(null);
      setSelectedMaterial(null);
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }
    
    // Se houver material selecionado mas o texto mudou, deseleciona
    if (selectedMaterial) {
      const currentCode = String(selectedMaterial.mat_codigo || '');
      const nomeMaterial = selectedMaterial.nm_material ?? selectedMaterial.material;
      const currentDisplay = `${currentCode} - ${nomeMaterial}`;
      
      // Se o texto não corresponde ao material selecionado, deseleciona e limpa filtro
      if (newValue !== currentDisplay && !newValue.startsWith(currentCode)) {
        setSelectedMaterial(null);
        onChange(null);
        onMaterialChange?.(null);
      }
    }
    
    // Mostra sugestões se houver texto
    if (newValue.length >= 1) {
      setShowSuggestions(true);
    }
  };

  /**
   * Manipula seleção de material da lista de sugestões
   * @param {Object} material - Material selecionado com mat_codigo (INTEGER) e material (text)
   */
  const handleSelectMaterial = (material) => {
    if (!material || material.mat_codigo == null) return;

    setSelectedMaterial(material);
    // df_movimento.mat_codigo é int4: garantir string válida para onChange
    const { valid, value: matCodigoStr } = parseMatCodigoInt4(material.mat_codigo);
    if (!valid || !matCodigoStr) return;

    const nomeMaterial = material.nm_material ?? material.material;
    
    setSearchTerm(`${matCodigoStr} - ${nomeMaterial}`);
    setShowSuggestions(false);
    
    onChange(matCodigoStr);
    onMaterialChange?.({ mat_codigo: matCodigoStr, material: nomeMaterial });
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedMaterial(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(null);
    onMaterialChange?.(null);
    inputRef.current?.focus();
  };

  return (
    <div className="material-filter-text">
      <label htmlFor="material-filter-input" className="material-filter-label">
        Filtrar por Material:
      </label>
      <div className="material-filter-input-wrapper">
        <input
          ref={inputRef}
          id="material-filter-input"
          type="text"
          className="material-filter-input"
          placeholder="Digite o código (número) ou nome do material (vazio = total geral)"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            // Mostra sugestões se houver texto e sugestões disponíveis
            if (searchTerm.length >= 2 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={async (e) => {
            // Enter: seleciona primeira sugestão OU aplica filtro com código digitado
            if (e.key === 'Enter') {
              e.preventDefault();
              
              // Se houver sugestões, seleciona a primeira
              if (suggestions.length > 0) {
                handleSelectMaterial(suggestions[0]);
                return;
              }
              
              // Se não houver sugestões mas houver código numérico válido (int4), aplica o filtro
              const trimmedSearch = searchTerm.trim();
              const parsed = parseMatCodigoInt4(trimmedSearch);
              if (parsed.valid && parsed.value) {
                setLoading(true);
                try {
                  const material = await loadMaterialByCode(parsed.value, true);
                  // Se material não foi encontrado, o filtro já foi aplicado em loadMaterialByCode
                  if (!material) {
                    // Filtro já foi aplicado, apenas fecha sugestões
                    setShowSuggestions(false);
                  }
                } catch (err) {
                  console.error('Erro ao aplicar filtro:', err);
                } finally {
                  setLoading(false);
                }
                return;
              }
              
              // Se não for código numérico, tenta buscar por nome (se houver sugestões pendentes)
              if (trimmedSearch.length >= 2) {
                // Aguarda um pouco para ver se as sugestões chegam
                setTimeout(async () => {
                  if (suggestions.length > 0) {
                    handleSelectMaterial(suggestions[0]);
                  }
                }, 100);
              }
            }
            
            // Escape fecha sugestões
            if (e.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
        />
        {loading && <span className="material-filter-loading">⏳</span>}
        {searchTerm && (
          <button
            type="button"
            className="material-filter-clear"
            onClick={handleClear}
            title="Limpar filtro"
          >
            ✕
          </button>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div ref={suggestionsRef} className="material-filter-suggestions">
            {suggestions.map((material) => (
              <div
                key={material.mat_codigo}
                className="material-filter-suggestion-item"
                onClick={() => handleSelectMaterial(material)}
              >
                <strong>{material.mat_codigo}</strong> - {material.nm_material ?? material.material}
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedMaterial && (
        <div className="material-filter-selected">
          ✓ Filtro ativo: {selectedMaterial.nm_material ?? selectedMaterial.material}
        </div>
      )}
    </div>
  );
}

export default MaterialFilterText;

import React from 'react';
import './RefreshButton.css';

/**
 * Componente de botão de refresh
 * @param {Function} onClick - Função chamada ao clicar
 * @param {boolean} isLoading - Se está carregando
 * @param {boolean} disabled - Se está desabilitado
 */
function RefreshButton({ onClick, isLoading = false, disabled = false }) {
  return (
    <button
      className={`refresh-button ${isLoading ? 'loading' : ''}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      title="Atualizar dados"
      type="button"
    >
      <span className="refresh-icon">↻</span>
      {isLoading && <span className="refresh-spinner">⏳</span>}
    </button>
  );
}

export default RefreshButton;

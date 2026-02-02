import React from 'react';
import './Header.css';

function Header({ page, setPage }) {
  const isDev = import.meta.env.DEV;
  const API_BASE_ENV = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';
  const API_BASE = isDev ? API_BASE_ENV : API_BASE_ENV;

  return (
    <header className="header">
      <div className="header-content">
        <div>
          <h1>Painel de Consumo de Materiais - SAFS-CHUFC</h1>
          <p>Dados consolidados para acompanhamento, projeção e alertas.</p>
        </div>
        <nav className="header-nav" aria-label="Navegação principal">
          <button
            type="button"
            className={'header-nav-link ' + (page === 'dashboard' ? 'active' : '')}
            onClick={() => setPage('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={'header-nav-link ' + (page === 'config' ? 'active' : '')}
            onClick={() => setPage('config')}
          >
            Configuração
          </button>
        </nav>
        <div className="api-badge">
          <span>API</span>
          <strong>{API_BASE}</strong>
        </div>
      </div>
    </header>
  );
}

export default Header;

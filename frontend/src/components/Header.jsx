import React from 'react';
import './Header.css';

function Header() {
  const isDev = import.meta.env.DEV;
  const API_BASE_ENV = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';
  // Em desenvolvimento mostra a URL real, em produção mostra o que está configurado
  const API_BASE = isDev ? API_BASE_ENV : API_BASE_ENV;

  return (
    <header className="header">
      <div className="header-content">
        <div>
          <h1>Painel de Consumo de Materiais - SAFS-CHUFC</h1>
          <p>Dados consolidados para acompanhamento, projeção e alertas.</p>
        </div>
        <div className="api-badge">
          <span>API</span>
          <strong>{API_BASE}</strong>
        </div>
      </div>
    </header>
  );
}

export default Header;

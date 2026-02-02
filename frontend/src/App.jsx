import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Config from './components/Config';
import ApiStatus from './components/ApiStatus';
import './App.css';

function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <>
      <ApiStatus />
      <Header page={page} setPage={setPage} />
      {page === 'dashboard' && <Dashboard />}
      {page === 'config' && <Config />}
    </>
  );
}

export default App;

import React from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ApiStatus from './components/ApiStatus';
import './App.css';

function App() {
  return (
    <>
      <ApiStatus />
      <Header />
      <Dashboard />
    </>
  );
}

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import {
  listAlertas,
  createAlerta,
  updateAlerta,
  deleteAlerta,
  enviarAlertasManual,
} from '../services/alertasApi';
import './Config.css';

const TAB_ALERTAS_EMAIL = 'alertas-email';

function Config() {
  const [activeTab, setActiveTab] = useState(TAB_ALERTAS_EMAIL);
  const [destinatarios, setDestinatarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nm_destinatario: '', email_destinatario: '', ativo: true });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [enviarLoading, setEnviarLoading] = useState(false);
  const [enviarConfirm, setEnviarConfirm] = useState(false);
  const [showInativos, setShowInativos] = useState(false);

  const loadDestinatarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAlertas(showInativos);
      setDestinatarios(res?.data ?? []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar destinatários');
    } finally {
      setLoading(false);
    }
  }, [showInativos]);

  useEffect(() => {
    if (activeTab === TAB_ALERTAS_EMAIL) {
      loadDestinatarios();
    }
  }, [activeTab, loadDestinatarios]);

  const openNovo = () => {
    setEditingId(null);
    setForm({ nm_destinatario: '', email_destinatario: '', ativo: true });
    setModalOpen(true);
  };

  const openEditar = (row) => {
    setEditingId(row.id_alerta);
    setForm({
      nm_destinatario: row.nm_destinatario || '',
      email_destinatario: row.email_destinatario || '',
      ativo: !!row.ativo,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm({ nm_destinatario: '', email_destinatario: '', ativo: true });
    setSubmitLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nm_destinatario?.trim() || !form.email_destinatario?.trim()) {
      setError('Nome e e-mail são obrigatórios.');
      return;
    }
    setSubmitLoading(true);
    setError(null);
    try {
      if (editingId) {
        await updateAlerta(editingId, form);
      } else {
        await createAlerta(form);
      }
      closeModal();
      await loadDestinatarios();
    } catch (err) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRemover = async (id, nome) => {
    if (!window.confirm('Remover o destinatário "' + nome + '"?')) return;
    setError(null);
    try {
      await deleteAlerta(id);
      await loadDestinatarios();
    } catch (err) {
      setError(err.message || 'Erro ao remover');
    }
  };

  const handleEnviarManual = async () => {
    if (!enviarConfirm) {
      setEnviarConfirm(true);
      return;
    }
    setEnviarLoading(true);
    setError(null);
    try {
      const result = await enviarAlertasManual();
      const msg = 'Envio concluído. Enviados: ' + result.sent + ', Falhas: ' + result.failed +
        (result.errors?.length ? '. Erros: ' + result.errors.map((e) => e.email).join(', ') : '');
      alert(msg);
      setEnviarConfirm(false);
    } catch (err) {
      setError(err.message || 'Erro ao enviar alertas');
    } finally {
      setEnviarLoading(false);
    }
  };

  return (
    <main className="container config-page">
      <h2 className="section-title">Configuração</h2>
      <p className="section-subtitle">Gerencie setores, alertas e parâmetros do sistema.</p>

      <nav className="config-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === TAB_ALERTAS_EMAIL}
          className={'config-tab ' + (activeTab === TAB_ALERTAS_EMAIL ? 'active' : '')}
          onClick={() => setActiveTab(TAB_ALERTAS_EMAIL)}
        >
          <span className="config-tab-icon" aria-hidden>✉</span>
          Alertas de Email
        </button>
      </nav>

      {activeTab === TAB_ALERTAS_EMAIL && (
        <div className="config-content card">
          <div className="config-alertas-banner">
            <span className="config-alertas-banner-icon" aria-hidden>✉</span>
            <div>
              <h3 className="config-alertas-banner-title">Sistema de Alertas Automáticos</h3>
              <p className="config-alertas-banner-text">
                O sistema envia alertas nos dias <strong>6, 16 e 25</strong> de cada mês às 08:00 para os e-mails cadastrados abaixo
                (relatório de materiais com crescimento abrupto ≥ 30%). Você também pode enviar os alertas manualmente a qualquer momento.
              </p>
            </div>
          </div>

          {error && (
            <div className="config-error" role="alert">
              {error}
            </div>
          )}

          <div className="card-header config-actions">
            <div />
            <div className="card-header-actions">
              <button
                type="button"
                className="btn btn-secondary config-btn-enviar"
                onClick={handleEnviarManual}
                disabled={enviarLoading}
              >
                <span aria-hidden>✈</span>
                {enviarConfirm ? 'Confirmar envio?' : 'Enviar Alertas Manualmente'}
              </button>
              {enviarConfirm && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEnviarConfirm(false)}
                >
                  Cancelar
                </button>
              )}
              <button type="button" className="btn btn-primary" onClick={openNovo}>
                Adicionar Email
              </button>
            </div>
          </div>

          <label className="config-filter-inativos">
            <input
              type="checkbox"
              checked={showInativos}
              onChange={(e) => setShowInativos(e.target.checked)}
            />
            Mostrar inativos
          </label>

          {loading ? (
            <p className="config-loading">Carregando destinatários...</p>
          ) : (
            <div className="config-table-wrap">
              <table className="config-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {destinatarios.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="config-table-empty">
                        Nenhum destinatário cadastrado. Clique em Adicionar Email para incluir.
                      </td>
                    </tr>
                  ) : (
                    destinatarios.map((row) => (
                      <tr key={row.id_alerta}>
                        <td>{row.nm_destinatario}</td>
                        <td>{row.email_destinatario}</td>
                        <td>
                          <span className={'status-pill ' + (row.ativo ? 'status-ativo' : 'status-inativo')}>
                            {row.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="config-link config-link-edit"
                            onClick={() => openEditar(row)}
                          >
                            Editar
                          </button>
                          {' · '}
                          <button
                            type="button"
                            className="config-link config-link-remove"
                            onClick={() => handleRemover(row.id_alerta, row.nm_destinatario)}
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="config-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="config-modal">
            <h3 id="modal-title" className="config-modal-title">
              {editingId ? 'Editar Alerta' : 'Novo Alerta'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="config-form-group">
                <label htmlFor="alerta-nome">Nome do Destinatário *</label>
                <input
                  id="alerta-nome"
                  type="text"
                  value={form.nm_destinatario}
                  onChange={(e) => setForm((f) => ({ ...f, nm_destinatario: e.target.value }))}
                  required
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="config-form-group">
                <label htmlFor="alerta-email">Email *</label>
                <input
                  id="alerta-email"
                  type="email"
                  value={form.email_destinatario}
                  onChange={(e) => setForm((f) => ({ ...f, email_destinatario: e.target.value }))}
                  required
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="config-form-group config-form-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                  />
                  Ativo
                </label>
              </div>
              <div className="config-modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Config;

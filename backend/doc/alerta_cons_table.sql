-- Tabela de destinatários para alertas de consumo (Materiais com crescimento abrupto).
-- Schema: ctrl (conforme DB_SCHEMA no .env).
-- Estrutura alinhada à tabela existente (owner abimael).

CREATE SCHEMA IF NOT EXISTS ctrl;

CREATE TABLE IF NOT EXISTS ctrl.alerta_cons (
  id_alerta         SERIAL NOT NULL,
  nm_destinatario   TEXT NOT NULL,
  email_destinatario VARCHAR(255) NOT NULL,
  ativo             BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT alerta_cons_cons_destinatario_key UNIQUE (email_destinatario),
  CONSTRAINT alerta_cons_pkey PRIMARY KEY (id_alerta)
);

COMMENT ON TABLE ctrl.alerta_cons IS 'Destinatários dos alertas de consumo (crescimento abrupto).';

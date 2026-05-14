/**
 * Resolução segura da senha do banco de dados
 * Evita problemas com caracteres especiais (#, !, @, etc.) no .env,
 * onde o # pode ser interpretado como início de comentário por alguns parsers.
 *
 * Opções:
 * 1. DB_PASSWORD="senha#com#hash"  (aspas duplas; em alguns ambientes o # pode truncar)
 * 2. DB_PASSWORD_FILE=.env.password (arquivo contendo apenas a senha, sem parsing)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(__dirname, '../..');

function stripQuotedEnvValue(value) {
  const trimmed = String(value).replace(/\r\n/g, '\n').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** Carrega backend/.env (ou cwd/.env) antes de resolver credenciais. */
function loadBackendEnv() {
  const cwdEnv = path.join(process.cwd(), '.env');
  const backendEnv = path.join(backendDir, '.env');
  if (fs.existsSync(cwdEnv)) {
    dotenv.config({ path: cwdEnv });
    return;
  }
  if (fs.existsSync(backendEnv)) {
    dotenv.config({ path: backendEnv });
  }
}

/**
 * Resolve caminho absoluto do arquivo de senha (suporta cwd e diretório do backend).
 * Normaliza o path (trim, remove \r\n do valor do .env).
 */
function resolvePasswordFilePath(filePath) {
  const normalized = String(filePath).replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  if (path.isAbsolute(normalized)) return normalized;
  const cwd = process.cwd();
  const candidates = [
    path.resolve(backendDir, normalized),
    path.resolve(cwd, normalized),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.resolve(backendDir, normalized);
}

/**
 * Retorna a senha do banco: de arquivo (DB_PASSWORD_FILE) ou de process.env.DB_PASSWORD.
 * Caminho do arquivo pode ser absoluto ou relativo ao diretório do backend ou ao cwd.
 * @returns {string}
 */
export function resolveDbPassword() {
  loadBackendEnv();

  const filePathRaw = process.env.DB_PASSWORD_FILE;
  if (filePathRaw != null && String(filePathRaw).trim() !== '') {
    const filePath = stripQuotedEnvValue(filePathRaw);
    const hasPathSeparators = /[/\\]/.test(filePath) || path.isAbsolute(filePath);
    const looksLikePasswordFile = /\.(password|secret|txt)$/i.test(filePath);
    const fullPath = resolvePasswordFilePath(filePath);
    let pathExists = false;
    try {
      pathExists = Boolean(fullPath && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile());
    } catch {
      pathExists = false;
    }
    if (pathExists) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const password = content.replace(/\r\n/g, '\n').trim();
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 Senha do banco carregada de arquivo:', fullPath);
        }
        return password;
      } catch (err) {
        if (err.code === 'ENOENT' || err.code === 'EISDIR') {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 Senha do banco usada a partir de DB_PASSWORD_FILE (valor literal).');
          }
          return filePath;
        }
        console.error('Erro ao ler DB_PASSWORD_FILE:', err.message, 'Caminho:', fullPath);
        throw new Error(
          `Não foi possível ler o arquivo de senha (DB_PASSWORD_FILE=${filePath}). Verifique o caminho e permissões.`
        );
      }
    }
    if (!hasPathSeparators && !looksLikePasswordFile) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Senha do banco usada a partir de DB_PASSWORD_FILE (valor literal).');
      }
      return filePath;
    }
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `⚠️ Arquivo de senha não encontrado (${filePath}). Verifique DB_PASSWORD_FILE no .env.`
      );
    }
    throw new Error(
      `Não foi possível ler o arquivo de senha (DB_PASSWORD_FILE=${filePath}). Verifique o caminho e permissões.`
    );
  }

  const pass = stripQuotedEnvValue(process.env.DB_PASSWORD ?? '');
  if (pass == null || pass === '') {
    throw new Error(
      'DB_PASSWORD ou DB_PASSWORD_FILE deve estar definido no .env. ' +
      'Para senhas com # ou outros caracteres especiais, use DB_PASSWORD_FILE.'
    );
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Senha do banco carregada de DB_PASSWORD (variável de ambiente)');
  }
  return pass;
}

/**
 * Retorna a senha SMTP: de arquivo (SMTP_PASSWORD_FILE) ou de process.env.SMTP_PASSWORD.
 * Mesma lógica de resolveDbPassword: se SMTP_PASSWORD_FILE não for caminho de arquivo existente, usa como senha literal.
 * @returns {string|null} Senha ou null se não definida
 */
export function resolveSmtpPassword() {
  loadBackendEnv();
  const filePathRaw = process.env.SMTP_PASSWORD_FILE;
  if (filePathRaw != null && String(filePathRaw).trim() !== '') {
    const filePath = stripQuotedEnvValue(filePathRaw);
    const hasPathSeparators = /[/\\]/.test(filePath) || path.isAbsolute(filePath);
    const fullPath = resolvePasswordFilePath(filePath);
    let pathExists = false;
    try {
      pathExists = Boolean(fullPath && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile());
    } catch {
      pathExists = false;
    }
    if (pathExists) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        return content.replace(/\r\n/g, '\n').trim();
      } catch (err) {
        if (err.code === 'ENOENT' || err.code === 'EISDIR') return filePath;
        throw new Error(`Não foi possível ler SMTP_PASSWORD_FILE: ${err.message}`);
      }
    }
    if (!hasPathSeparators) return filePath;
    return filePath;
  }
  const pass = stripQuotedEnvValue(process.env.SMTP_PASSWORD ?? '');
  if (pass == null || pass === '') return null;
  return String(pass).trim() || null;
}

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

/** Garante que .env foi carregado (útil quando este módulo é carregado antes de app.js) */
function ensureEnvLoaded() {
  const hasAny = process.env.DB_PASSWORD != null || process.env.DB_PASSWORD_FILE != null ||
    process.env.SMTP_USER != null || process.env.SMTP_PASSWORD != null || process.env.SMTP_PASSWORD_FILE != null;
  if (hasAny) return;
  const backendDir = path.join(__dirname, '../..');
  const cwd = process.cwd();
  const paths = [
    path.join(cwd, '.env'),
    path.join(backendDir, '.env'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
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
  const backendDir = path.join(__dirname, '../..');
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
  ensureEnvLoaded();

  const filePathRaw = process.env.DB_PASSWORD_FILE;
  if (filePathRaw != null && String(filePathRaw).trim() !== '') {
    const filePath = String(filePathRaw).replace(/\r\n/g, '\n').trim();
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
    if (!hasPathSeparators) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Senha do banco usada a partir de DB_PASSWORD_FILE (valor literal).');
      }
      return filePath;
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Senha do banco usada a partir de DB_PASSWORD_FILE (valor literal, arquivo não encontrado).');
    }
    return filePath;
  }

  const pass = process.env.DB_PASSWORD;
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
  ensureEnvLoaded();
  const filePathRaw = process.env.SMTP_PASSWORD_FILE;
  if (filePathRaw != null && String(filePathRaw).trim() !== '') {
    const filePath = String(filePathRaw).replace(/\r\n/g, '\n').trim();
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
  const pass = process.env.SMTP_PASSWORD;
  if (pass == null || pass === '') return null;
  return String(pass).trim() || null;
}

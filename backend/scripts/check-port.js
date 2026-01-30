#!/usr/bin/env node

/**
 * Script para verificar e gerenciar processos usando uma porta específica
 * Uso: node scripts/check-port.js [porta]
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);
const platform = os.platform();
const port = process.argv[2] || '5000';

console.log(`\n🔍 Verificando porta ${port}...\n`);

async function checkPortWindows(port) {
  try {
    // Encontrar processo usando a porta
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    
    if (!stdout.trim()) {
      console.log(`✅ Porta ${port} está livre!`);
      return;
    }

    console.log(`❌ Porta ${port} está em uso:\n`);
    console.log(stdout);
    
    // Extrair PIDs
    const lines = stdout.split('\n').filter(line => line.trim());
    const pids = new Set();
    
    lines.forEach(line => {
      const match = line.match(/\s+(\d+)$/);
      if (match) {
        pids.add(match[1]);
      }
    });

    if (pids.size > 0) {
      console.log(`\n📋 Processos encontrados (PIDs): ${Array.from(pids).join(', ')}`);
      console.log(`\n💡 Para encerrar os processos:`);
      pids.forEach(pid => {
        console.log(`   taskkill /PID ${pid} /F`);
      });
      
      console.log(`\n⚠️  Deseja encerrar esses processos? (y/n)`);
      console.log(`   (Execute manualmente os comandos acima se necessário)`);
    }
  } catch (error) {
    if (error.code === 1) {
      // netstat retorna código 1 quando não encontra nada
      console.log(`✅ Porta ${port} está livre!`);
    } else {
      console.error(`❌ Erro ao verificar porta:`, error.message);
    }
  }
}

async function checkPortUnix(port) {
  try {
    // Encontrar processo usando a porta
    const { stdout } = await execAsync(`lsof -i :${port}`);
    
    if (!stdout.trim()) {
      console.log(`✅ Porta ${port} está livre!`);
      return;
    }

    console.log(`❌ Porta ${port} está em uso:\n`);
    console.log(stdout);
    
    // Extrair PIDs
    const lines = stdout.split('\n').slice(1); // Pular cabeçalho
    const pids = new Set();
    
    lines.forEach(line => {
      const match = line.match(/^\S+\s+(\d+)/);
      if (match) {
        pids.add(match[1]);
      }
    });

    if (pids.size > 0) {
      console.log(`\n📋 Processos encontrados (PIDs): ${Array.from(pids).join(', ')}`);
      console.log(`\n💡 Para encerrar os processos:`);
      pids.forEach(pid => {
        console.log(`   kill -9 ${pid}`);
      });
    }
  } catch (error) {
    if (error.code === 1) {
      // lsof retorna código 1 quando não encontra nada
      console.log(`✅ Porta ${port} está livre!`);
    } else {
      console.error(`❌ Erro ao verificar porta:`, error.message);
      console.error(`\n💡 Certifique-se de que 'lsof' está instalado:`);
      console.error(`   macOS: Já incluído`);
      console.error(`   Linux: sudo apt-get install lsof`);
    }
  }
}

// Executar verificação baseada na plataforma
if (platform === 'win32') {
  checkPortWindows(port).catch(console.error);
} else {
  checkPortUnix(port).catch(console.error);
}

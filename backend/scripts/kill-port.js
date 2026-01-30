#!/usr/bin/env node

/**
 * Script para encerrar processos usando uma porta específica
 * Uso: node scripts/kill-port.js [porta]
 * 
 * ⚠️  ATENÇÃO: Este script encerra processos automaticamente!
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);
const platform = os.platform();
const port = process.argv[2] || '5000';

console.log(`\n🛑 Encerrando processos na porta ${port}...\n`);

async function killPortWindows(port) {
  try {
    // Encontrar PIDs
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    
    if (!stdout.trim()) {
      console.log(`✅ Nenhum processo encontrado na porta ${port}.`);
      return;
    }

    const lines = stdout.split('\n').filter(line => line.trim());
    const pids = new Set();
    
    lines.forEach(line => {
      const match = line.match(/\s+(\d+)$/);
      if (match) {
        pids.add(match[1]);
      }
    });

    if (pids.size === 0) {
      console.log(`✅ Nenhum processo encontrado na porta ${port}.`);
      return;
    }

    console.log(`📋 Encerrando processos: ${Array.from(pids).join(', ')}\n`);

    for (const pid of pids) {
      try {
        await execAsync(`taskkill /PID ${pid} /F`);
        console.log(`✅ Processo ${pid} encerrado.`);
      } catch (error) {
        console.error(`⚠️  Erro ao encerrar processo ${pid}:`, error.message);
      }
    }

    console.log(`\n✅ Concluído!`);
  } catch (error) {
    if (error.code === 1) {
      console.log(`✅ Nenhum processo encontrado na porta ${port}.`);
    } else {
      console.error(`❌ Erro:`, error.message);
    }
  }
}

async function killPortUnix(port) {
  try {
    // Encontrar PIDs
    const { stdout } = await execAsync(`lsof -ti :${port}`);
    
    if (!stdout.trim()) {
      console.log(`✅ Nenhum processo encontrado na porta ${port}.`);
      return;
    }

    const pids = stdout.trim().split('\n').filter(pid => pid.trim());
    
    console.log(`📋 Encerrando processos: ${pids.join(', ')}\n`);

    for (const pid of pids) {
      try {
        await execAsync(`kill -9 ${pid}`);
        console.log(`✅ Processo ${pid} encerrado.`);
      } catch (error) {
        console.error(`⚠️  Erro ao encerrar processo ${pid}:`, error.message);
      }
    }

    console.log(`\n✅ Concluído!`);
  } catch (error) {
    if (error.code === 1) {
      console.log(`✅ Nenhum processo encontrado na porta ${port}.`);
    } else {
      console.error(`❌ Erro:`, error.message);
      console.error(`\n💡 Certifique-se de que 'lsof' está instalado.`);
    }
  }
}

// Executar baseado na plataforma
if (platform === 'win32') {
  killPortWindows(port).catch(console.error);
} else {
  killPortUnix(port).catch(console.error);
}

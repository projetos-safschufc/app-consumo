# Guia Git: commit de alterações e ações necessárias

Este documento descreve passo a passo como fazer commit das alterações e outras ações comuns com Git no projeto **app-consumo**, usando o repositório **projetos-safschufc/app-consumo** no GitHub.

---

## Pré-requisitos

- Git instalado no computador.
- Repositório já clonado ou inicializado localmente.
- Acesso ao repositório no GitHub (credenciais/token configurados para push).

---

## 1. Verificar o estado do repositório

Antes de qualquer ação, confira o que foi alterado:

```powershell
cd C:\Users\ivalnei.sena\EBSERH\PROJECTOS\TESTES\app_consumo
git status
```

- **Arquivos em vermelho** (untracked) ou **em verde** (modified): ainda não foram commitados.
- **"nothing to commit, working tree clean"**: não há alterações pendentes.

---

## 2. Commit das alterações (passo a passo)

### Passo 2.1 – Adicionar arquivos ao stage

Adicionar **todos** os arquivos alterados:

```powershell
git add .
```

Adicionar apenas um arquivo específico:

```powershell
git add caminho/do/arquivo.js
```

### Passo 2.2 – Conferir o que será commitado

```powershell
git status
```

Os arquivos listados em verde (staged) serão incluídos no próximo commit.

### Passo 2.3 – Criar o commit com uma mensagem descritiva

```powershell
git commit -m "Descrição breve e clara do que foi alterado"
```

Exemplos de mensagens:

- `git commit -m "Corrige cálculo da projeção mensal"`
- `git commit -m "Adiciona coluna consumo no último mês na tabela de alertas"`
- `git commit -m "Atualiza README com instruções de instalação"`

### Passo 2.4 – Enviar as alterações para o GitHub (push)

```powershell
git push
```

Se for a primeira vez na branch ou ainda não tiver upstream configurado:

```powershell
git push -u origin main
```

Quando solicitado, use seu **usuário do GitHub** e o **token** (Personal Access Token) como senha.

---

## 3. Fluxo completo resumido (alteração → publicação)

```powershell
# 1. Ir para a pasta do projeto
cd C:\Users\ivalnei.sena\EBSERH\PROJECTOS\TESTES\app_consumo

# 2. Ver o que mudou
git status

# 3. Adicionar todas as alterações
git add .

# 4. Criar o commit
git commit -m "Sua mensagem descritiva aqui"

# 5. Enviar para o GitHub
git push
```

---

## 4. Outras ações necessárias

### 4.1 – Atualizar o repositório local (trazer alterações do GitHub)

Se outras pessoas (ou você em outro PC) fizeram alterações no repositório:

```powershell
git pull
```

Recomenda-se fazer `git pull` antes de começar a trabalhar e antes de dar `git push`, para evitar conflitos.

### 4.2 – Ver em qual branch você está

```powershell
git branch
```

O asterisco (*) indica a branch atual. O projeto usa a branch **main** como principal.

### 4.3 – Ver o histórico de commits

```powershell
git log --oneline
```

Exibe os últimos commits em uma linha cada.

### 4.4 – Ver a URL do repositório remoto

```powershell
git remote -v
```

Deve aparecer `origin` apontando para `https://github.com/projetos-safschufc/app-consumo.git`.

### 4.5 – Trocar a URL do remote (se necessário)

```powershell
git remote set-url origin https://github.com/projetos-safschufc/app-consumo.git
```

### 4.6 – Desfazer alterações em um arquivo (antes do commit)

Se você alterou um arquivo e **não** quer incluir no commit:

```powershell
git restore nome-do-arquivo
```

Ou, em versões antigas do Git:

```powershell
git checkout -- nome-do-arquivo
```

**Atenção:** isso descarta as alterações locais no arquivo.

### 4.7 – Remover um arquivo do stage (depois de git add, antes do commit)

```powershell
git restore --staged nome-do-arquivo
```

O arquivo continua alterado, mas não será incluído no próximo commit.

### 4.8 – Credenciais negadas (403) ou usuário errado

Se o `git push` falhar com "Permission denied" ou usar a conta errada:

1. Remover credenciais antigas do Windows:
   ```powershell
   cmdkey /delete:git:https://github.com
   ```
2. Rodar `git push` novamente e, quando solicitado, informar o **usuário** e o **token** da conta com acesso ao repositório.

---

## 5. Boas práticas

- **Mensagens de commit:** use frases curtas no imperativo (ex.: "Adiciona filtro por material", "Corrige exibição do percentual").
- **Commits frequentes:** faça commit de conjuntos lógicos de alteração, não acumule tudo em um único commit gigante.
- **Antes de push:** rode `git pull` se outras pessoas usam o mesmo repositório, para integrar alterações remotas.
- **Não commitar:** arquivos `.env` (senhas e configurações locais), `node_modules/`, pastas de build. O `.gitignore` do projeto já evita isso; não remova entradas dele.

---

## 6. Referência rápida

| Ação              | Comando                    |
|-------------------|----------------------------|
| Ver status        | `git status`               |
| Adicionar tudo    | `git add .`                |
| Fazer commit      | `git commit -m "mensagem"` |
| Enviar ao GitHub  | `git push`                 |
| Atualizar local   | `git pull`                 |
| Ver branch        | `git branch`               |
| Ver histórico     | `git log --oneline`        |
| Ver remote        | `git remote -v`            |

---

*Documento criado para o projeto app-consumo (projetos-safschufc/app-consumo).*

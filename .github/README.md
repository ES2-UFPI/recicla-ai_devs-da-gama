# 🤖 GitHub Actions & CI/CD - ReciclaAI

Bem-vindo à documentação de CI/CD do projeto ReciclaAI!

## 📑 Índice da Documentação

### 🚀 Começando
1. **[IMPLEMENTACAO_CI.md](./IMPLEMENTACAO_CI.md)** - Visão geral da implementação
2. **[QUICK_START_CI.md](./QUICK_START_CI.md)** - Guia rápido para usar o CI
3. **[CHECKLIST_CI_SPRINT2.md](./CHECKLIST_CI_SPRINT2.md)** - Checklist de tarefas da Sprint 2

### 📖 Documentação Completa
4. **[CI_CD_README.md](./CI_CD_README.md)** - Documentação técnica completa
5. **[EXEMPLOS_TESTES.md](./EXEMPLOS_TESTES.md)** - Exemplos práticos de testes

### ⚙️ Workflows
- **[workflows/dev-pr-ci.yml](./workflows/dev-pr-ci.yml)** - CI para Pull Requests → dev
- **[workflows/main-pr-ci.yml](./workflows/main-pr-ci.yml)** - CI/CD para Pull Requests → main

---

## 🎯 Quick Links

### Para Desenvolvedores
- 👉 Primeiro uso? Comece aqui: [QUICK_START_CI.md](./QUICK_START_CI.md)
- 🧪 Precisa escrever testes? Veja: [EXEMPLOS_TESTES.md](./EXEMPLOS_TESTES.md)
- ✅ Acompanhe o progresso: [CHECKLIST_CI_SPRINT2.md](./CHECKLIST_CI_SPRINT2.md)

### Para Scrum Master/Líderes
- 📊 Visão geral da implementação: [IMPLEMENTACAO_CI.md](./IMPLEMENTACAO_CI.md)
- 📚 Documentação completa: [CI_CD_README.md](./CI_CD_README.md)

---

## 🔥 TL;DR (Resumo Rápido)

### O que o CI faz?

**Para PRs → DEV:**
```
✅ Build Backend (Python/FastAPI)
✅ Build Frontend (React/TypeScript)
✅ Linting (ESLint)
⚠️ Testes (opcional - não bloqueia)
✅ Docker Compose válido
```

**Para PRs → MAIN:**
```
✅ Tudo do CI para DEV
✅ Build Docker (backend + frontend)
✅ Docker Compose funcional (sobe containers)
✅ Testes OBRIGATÓRIOS (bloqueia se falhar)
```

---

## 🚦 Como Usar

### 1. Trabalhar em uma Feature
```bash
# Criar branch
git checkout -b victor#115

# Fazer alterações
# ... código ...

# Testar localmente antes do commit
cd backend && pytest tests/ -v
cd ../frontend && npm run lint && npm run build

# Commit e push
git add .
git commit -m "feat: adiciona funcionalidade X"
git push origin victor#115
```

### 2. Criar Pull Request
1. Vá para GitHub
2. Abra PR da sua branch → `dev`
3. CI rodará automaticamente
4. Aguarde os checks passarem (✅)
5. Peça revisão da equipe
6. Merge quando aprovado!

---

## 📊 Status dos Workflows

### ✅ Implementado
- [x] CI para PRs → dev
- [x] CI/CD para PRs → main
- [x] Documentação completa
- [x] Estrutura de testes inicial
- [x] Exemplos de testes

### 🔄 Em Andamento (Sprint 2)
- [ ] Implementação dos testes (TDD)
- [ ] Configuração de cobertura
- [ ] Badges de status

### 🔮 Futuro
- [ ] Deploy automático (CD)
- [ ] Testes E2E
- [ ] Análise de segurança
- [ ] Notificações Discord/Slack

---

## 🆘 Precisa de Ajuda?

### Problemas Comuns

**CI está falhando?**
1. Verifique os logs no GitHub (clique em "Details")
2. Rode os mesmos comandos localmente
3. Veja o [troubleshooting](./CI_CD_README.md#troubleshooting)

**Não sabe como escrever um teste?**
1. Veja os [exemplos práticos](./EXEMPLOS_TESTES.md)
2. Use os templates em `backend/tests/`
3. Pergunte no grupo da equipe

**CI está muito lento?**
1. Verifique se está testando apenas o necessário
2. Use cache quando possível
3. Otimize os testes localmente primeiro

---

## 👥 Equipe

**Implementado por**: Equipe ReciclaAI  
**Sprint**: 2 (Novembro 2025)  
**Disciplina**: Engenharia de Software 2 - UFPI

**Membros**:
- Gabriel Lopes (Scrum Master)
- José Victor Vieira (Backend)
- Pedro Emanuel (Backend)
- Thalys Yago (Backend)

---

## 📝 Changelog

### v1.0.0 - 05/11/2025
- ✅ Implementação inicial do CI/CD
- ✅ Workflows para dev e main
- ✅ Documentação completa
- ✅ Templates de teste
- ✅ Guias e exemplos

---

## 🎓 Aprendizados da Sprint

_Esta seção será atualizada no final da sprint com os aprendizados da equipe sobre CI/CD e TDD_

---

**Última atualização**: 05/11/2025  
**Versão**: 1.0.0

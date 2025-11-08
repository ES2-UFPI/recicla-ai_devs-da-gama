# 🚀 CI/CD ReciclaAI - Guia Visual

## 📁 Estrutura Criada

```
.github/
├── workflows/
│   ├── dev-pr-ci.yml          # ✅ CI para dev
│   └── main-pr-ci.yml         # ✅ CI/CD para main
├── README.md                  # 📑 Índice principal
├── IMPLEMENTACAO_CI.md        # 📊 Visão geral
├── CI_CD_README.md            # 📖 Docs completa
├── QUICK_START_CI.md          # ⚡ Guia rápido
├── CHECKLIST_CI_SPRINT2.md   # ✅ Checklist
└── EXEMPLOS_TESTES.md         # 🧪 Exemplos de testes

backend/
├── tests/                     # 🧪 Testes
│   ├── __init__.py
│   └── test_user_service.py   # Template
└── pyproject.toml             # ⚙️ Config pytest
```

---

## 🔄 Fluxo de Trabalho

```
┌─────────────────────┐
│  Feature Branch     │
│  (victor#115)       │
└──────────┬──────────┘
           │
           │ git push
           ▼
┌─────────────────────┐
│  Abrir PR → DEV     │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │   CI - DEV   │
    │  ✓ Build     │
    │  ✓ Lint      │
    │  ⚠ Tests     │
    └──────┬───────┘
           │
           ▼
┌─────────────────────┐
│  Merge para DEV     │
└──────────┬──────────┘
           │
           │ (múltiplos merges)
           ▼
┌─────────────────────┐
│  PR: DEV → MAIN     │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │ CI/CD - MAIN │
    │  ✓ Build     │
    │  ✓ Lint      │
    │  ✓ Tests     │
    │  ✓ Docker    │
    └──────┬───────┘
           │
           ▼
┌─────────────────────┐
│  Release (MAIN)     │
└─────────────────────┘
```

---

## 🎯 Diferenças entre os CIs

| Feature | PR → DEV | PR → MAIN |
|---------|----------|-----------|
| **Build Backend** | ✅ Sim | ✅ Sim |
| **Build Frontend** | ✅ Sim | ✅ Sim |
| **Linting** | ✅ Sim | ✅ Sim |
| **Testes** | ⚠️ Opcional | ✅ Obrigatório |
| **Docker Build** | ❌ Não | ✅ Sim |
| **Docker Up** | ❌ Não | ✅ Sim |
| **Bloqueia merge?** | 🟡 Parcial | 🔴 Total |

---

## 💻 Comandos Essenciais

### Testar Localmente (Backend)
```bash
cd backend
pytest tests/ -v                    # Rodar testes
python -m py_compile server.py      # Verificar sintaxe
```

### Testar Localmente (Frontend)
```bash
cd frontend
npm run lint                        # Linting
npm run build                       # Build
npm test                            # Testes (quando impl.)
```

### Testar Docker
```bash
docker compose config               # Validar config
docker compose build                # Build imagens
docker compose up -d                # Subir containers
docker compose ps                   # Ver status
docker compose down                 # Derrubar tudo
```

---

## 📊 Status Visual no GitHub

### Como ver os checks:

1. **Abra seu Pull Request**

2. **Role até o final** - você verá algo assim:
```
┌────────────────────────────────────────┐
│ All checks have passed                 │
├────────────────────────────────────────┤
│ ✅ Backend - Build e Testes            │
│ ✅ Frontend - Build e Lint             │
│ ✅ Verificação de Integração           │
└────────────────────────────────────────┘
```

3. **Clique em "Details"** para ver logs completos

---

## 🧪 Implementar Testes na Sprint 2

### Estrutura Sugerida

**Backend** (`backend/tests/`):
```
tests/
├── __init__.py
├── test_user_service.py        # ← Começar aqui
├── test_residue_service.py
├── test_scheduling_service.py
├── test_collection_service.py
└── test_endpoints.py
```

**Frontend** (`frontend/src/__tests__/`):
```
src/
├── components/
│   ├── UserForm.tsx
│   └── __tests__/
│       └── UserForm.test.tsx   # ← Começar aqui
├── hooks/
│   ├── useAuth.ts
│   └── __tests__/
│       └── useAuth.test.ts
└── services/
    ├── userService.ts
    └── __tests__/
        └── userService.test.ts
```

---

## ✅ Checklist Rápido

### Antes de Criar PR:
- [ ] Código compila/builda sem erros
- [ ] Linting passa (`npm run lint`)
- [ ] Testes locais passam
- [ ] Commit message descritivo

### Ao Criar PR:
- [ ] Título e descrição claros
- [ ] Issues relacionadas linkadas
- [ ] CI passou (todos os checks ✅)
- [ ] Revisores marcados

### Antes de Merge:
- [ ] Aprovação de pelo menos 1 revisor
- [ ] CI completamente verde
- [ ] Conflitos resolvidos
- [ ] Branch atualizada com base

---

## 🆘 Troubleshooting Express

| Problema | Solução |
|----------|---------|
| ❌ **Linting falha** | `npm run lint -- --fix` |
| ❌ **Build falha** | Limpe cache: `rm -rf node_modules && npm ci` |
| ❌ **Testes falhando** | Rode localmente: `pytest tests/ -v` |
| ❌ **Docker falha** | Limpe cache: `docker system prune -af` |
| ⏱️ **CI muito lento** | Otimize testes, use cache |

---

## 📚 Documentos por Necessidade

| Preciso de... | Veja... |
|---------------|---------|
| 🎯 **Visão geral rápida** | [README.md](./README.md) |
| ⚡ **Começar agora** | [QUICK_START_CI.md](./QUICK_START_CI.md) |
| 🧪 **Escrever testes** | [EXEMPLOS_TESTES.md](./EXEMPLOS_TESTES.md) |
| ✅ **Acompanhar tarefas** | [CHECKLIST_CI_SPRINT2.md](./CHECKLIST_CI_SPRINT2.md) |
| 📖 **Entender tudo** | [CI_CD_README.md](./CI_CD_README.md) |
| 📊 **Apresentar para equipe** | [IMPLEMENTACAO_CI.md](./IMPLEMENTACAO_CI.md) |

---

## 🎯 Métricas de Sucesso

Ao final da Sprint 2, queremos:

```
✅ 100% dos PRs passam pelo CI
✅ 70%+ de cobertura de testes
✅ 0 merges com CI falhando na main
✅ Toda equipe confortável com TDD
✅ Releases confiáveis
```

---

## 👥 Responsabilidades

```
┌────────────────────────────────────────┐
│ TODOS OS DESENVOLVEDORES               │
│ • Testar localmente antes de push     │
│ • Corrigir falhas do CI rapidamente   │
│ • Escrever testes para novo código    │
└────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ REVISORES DE PR                        │
│ • Verificar CI passou antes de aprovar│
│ • Revisar qualidade dos testes        │
│ • Dar feedback construtivo            │
└────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ SCRUM MASTER                           │
│ • Garantir CI verde antes de release  │
│ • Resolver bloqueios do CI            │
│ • Acompanhar métricas                 │
└────────────────────────────────────────┘
```

---

## 🎉 Pronto para Começar!

1. ✅ **Leia** o [QUICK_START_CI.md](./QUICK_START_CI.md)
2. ✅ **Configure** seu ambiente (pytest/vitest)
3. ✅ **Implemente** seu primeiro teste
4. ✅ **Crie** um PR e veja o CI em ação!

---

**Sprint 2 - ReciclaAI**  
**Novembro 2025**  
**ES2 - UFPI**

---

### 📞 Dúvidas?

Consulte a documentação completa ou pergunte no grupo da equipe! 🚀

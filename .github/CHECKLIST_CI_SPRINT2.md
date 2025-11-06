# ✅ Checklist de Implementação do CI - Sprint 2

## 📋 Status da Implementação

### ✅ Fase 1: Infraestrutura (CONCLUÍDO)
- [x] Criar workflows do GitHub Actions
  - [x] `dev-pr-ci.yml` (CI para dev)
  - [x] `main-pr-ci.yml` (CI/CD para main)
- [x] Documentação
  - [x] README principal do CI
  - [x] Guia rápido
  - [x] Documento de implementação
- [x] Estrutura inicial de testes
  - [x] Pasta `backend/tests/`
  - [x] Template `test_user_service.py`
  - [x] Configuração pytest (`pyproject.toml`)

---

### 🔄 Fase 2: Preparação do Ambiente (EM ANDAMENTO)

#### Backend
- [ ] Instalar dependências de teste
  ```bash
  cd backend
  pip install pytest pytest-asyncio httpx
  ```
- [ ] Atualizar `requirements.txt` com as novas dependências
- [ ] Testar que pytest funciona localmente
  ```bash
  pytest tests/ -v
  ```

#### Frontend
- [ ] Configurar Vitest
  ```bash
  cd frontend
  npm install -D vitest @testing-library/react @testing-library/jest-dom
  ```
- [ ] Adicionar script de teste no `package.json`
  ```json
  "test": "vitest"
  ```
- [ ] Testar que vitest funciona localmente
  ```bash
  npm test
  ```

---

### 📝 Fase 3: Implementação de Testes (TDD - Sprint 2)

#### Backend - Testes Prioritários

**Módulo de Usuários**:
- [ ] `test_user_service.py`
  - [ ] Teste: criar usuário válido
  - [ ] Teste: falha ao criar usuário com email duplicado
  - [ ] Teste: validação de campos obrigatórios
  - [ ] Teste: autenticação com credenciais válidas
  - [ ] Teste: autenticação com credenciais inválidas

**Módulo de Resíduos**:
- [ ] `test_residue_service.py`
  - [ ] Teste: criar resíduo válido
  - [ ] Teste: calcular valor estimado
  - [ ] Teste: listar resíduos por produtor
  - [ ] Teste: atualizar resíduo
  - [ ] Teste: deletar resíduo

**Módulo de Agendamento**:
- [ ] `test_scheduling_service.py`
  - [ ] Teste: criar agendamento válido
  - [ ] Teste: validar timezone (bug conhecido)
  - [ ] Teste: listar agendamentos disponíveis
  - [ ] Teste: cancelar agendamento

**Módulo de Coleta**:
- [ ] `test_collection_service.py`
  - [ ] Teste: iniciar coleta
  - [ ] Teste: confirmar coleta
  - [ ] Teste: listar coletas do coletor

**Endpoints**:
- [ ] `test_endpoints.py`
  - [ ] Teste: POST /users/register
  - [ ] Teste: POST /auth/login
  - [ ] Teste: GET /residues
  - [ ] Teste: POST /scheduling

#### Frontend - Testes Prioritários

**Componentes**:
- [ ] `UserForm.test.tsx`
  - [ ] Teste: renderização do formulário
  - [ ] Teste: validação de campos
  - [ ] Teste: submissão do formulário

- [ ] `ResidueList.test.tsx`
  - [ ] Teste: listar resíduos
  - [ ] Teste: filtrar resíduos
  - [ ] Teste: ações nos resíduos

- [ ] `SchedulingForm.test.tsx`
  - [ ] Teste: criar agendamento
  - [ ] Teste: validar datas
  - [ ] Teste: selecionar resíduos

---

### 🔧 Fase 4: Configuração Avançada (OPCIONAL)

- [ ] Configurar cobertura de testes
  ```bash
  # Backend
  pip install pytest-cov
  pytest --cov=src tests/
  
  # Frontend
  npm test -- --coverage
  ```

- [ ] Adicionar badges no README
  ```markdown
  ![CI Status](https://github.com/ES2-UFPI/recicla-ai_devs-da-gama/workflows/CI/badge.svg)
  ```

- [ ] Configurar notificações (Discord/Slack)

- [ ] Adicionar análise de segurança
  - [ ] Dependabot
  - [ ] CodeQL

---

### 🚀 Fase 5: Validação e Deploy (FINAL DA SPRINT)

#### Antes do PR dev → main

- [ ] Todos os testes implementados passam localmente
- [ ] CI está verde em todos os PRs recentes para dev
- [ ] Docker Compose funciona sem erros
- [ ] Documentação atualizada
- [ ] Time revisou e aprovou

#### Criar PR dev → main

- [ ] CI/CD completo passa (incluindo Docker)
- [ ] Testes obrigatórios passam
- [ ] Aprovação de pelo menos 2 membros
- [ ] Merge para main
- [ ] Criar tag de release (v1.1.0)

---

## 📊 Acompanhamento

### Responsáveis por Módulo

| Módulo | Responsável | Status |
|--------|-------------|--------|
| User Service | ? | ⏳ Pendente |
| Residue Service | ? | ⏳ Pendente |
| Scheduling Service | ? | ⏳ Pendente |
| Collection Service | ? | ⏳ Pendente |
| Frontend Components | ? | ⏳ Pendente |

### Timeline da Sprint 2

```
Semana 1 (05-09/11):
├── Setup CI/CD ✅
├── Configurar ambiente de testes
└── Primeiros testes (User Service)

Semana 2 (12-16/11):
├── Testes de Residue e Scheduling
├── Testes de Collection
└── Testes de Frontend (início)

Semana 3 (19-23/11):
├── Completar testes de Frontend
├── Testes de integração
├── Correção de bugs encontrados
└── PR dev → main
```

---

## 🎯 Critérios de Sucesso

Para considerar o CI implementado com sucesso:

- [ ] **100%** dos PRs para dev passam pelo CI
- [ ] **Pelo menos 70%** de cobertura de testes nos módulos críticos
- [ ] **0 merges** na main com CI falhando
- [ ] **Todos os devs** sabem usar o CI
- [ ] **Documentação** completa e clara

---

## 📝 Notas da Equipe

_Use este espaço para anotações durante a sprint_

**Issues/Bugs encontrados pelo CI**:
- 

**Melhorias identificadas**:
- 

**Lições aprendidas**:
- 

---

## 🆘 Precisa de Ajuda?

### Recursos
- [Documentação do CI](.github/CI_CD_README.md)
- [Guia Rápido](.github/QUICK_START_CI.md)
- [Implementação Detalhada](.github/IMPLEMENTACAO_CI.md)

### Contatos
- Dúvidas sobre CI: [Gabriel/Scrum Master]
- Dúvidas sobre testes Backend: [José Victor/Pedro/Thalys]
- Dúvidas sobre testes Frontend: [Gabriel]

---

**Última atualização**: 05/11/2025  
**Versão**: 1.0  
**Sprint**: 2

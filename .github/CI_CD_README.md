# GitHub Actions CI/CD - ReciclaAI

Este documento descreve a implementação de Continuous Integration (CI) para o projeto ReciclaAI utilizando GitHub Actions.

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Workflows Implementados](#workflows-implementados)
- [Como Funciona](#como-funciona)
- [Estrutura de Branches](#estrutura-de-branches)
- [Preparação para Testes](#preparação-para-testes)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

Implementamos dois workflows principais de CI que se alinham com o fluxo de trabalho da equipe:

1. **dev-pr-ci.yml**: Executa em Pull Requests para a branch `dev`
2. **main-pr-ci.yml**: Executa em Pull Requests para a branch `main` (release)

Ambos os workflows verificam:
- ✅ Build do Backend (Python/FastAPI)
- ✅ Build do Frontend (React/TypeScript)
- ✅ Linting do código
- ✅ Testes automatizados (quando implementados)
- ✅ Validação do Docker Compose

---

## Workflows Implementados

### 1. CI para Pull Requests → DEV (`dev-pr-ci.yml`)

**Quando executa**: Sempre que um PR é aberto/atualizado para a branch `dev`

**O que verifica**:
- **Backend**:
  - Instala dependências Python
  - Verifica sintaxe do código Python
  - Roda testes (se existirem) - *não bloqueia o merge se não houver testes*
  
- **Frontend**:
  - Instala dependências Node.js
  - Executa linting (ESLint)
  - Faz build do projeto TypeScript
  - Roda testes (se existirem) - *não bloqueia o merge se não houver testes*
  
- **Integração**:
  - Valida configuração do `docker-compose.yml`

**Comportamento**: Mais permissivo, permitindo merge mesmo sem testes (útil durante desenvolvimento)

---

### 2. CI/CD para Pull Requests → MAIN (`main-pr-ci.yml`)

**Quando executa**: Sempre que um PR é aberto/atualizado para a branch `main`

**O que verifica**:
- Todas as verificações do workflow DEV, **MAIS**:
  - **Build das imagens Docker** (backend e frontend)
  - **Validação completa do Docker Compose** (sobe os containers)
  - **Verificação de saúde dos serviços**
  - **BLOQUEIA merge se não houver testes** (mais rigoroso para releases)

**Comportamento**: Mais rigoroso, exige que os testes existam e passem antes do merge para produção

---

## Como Funciona

### Fluxo de Trabalho

```
┌─────────────────────────────────────────────────────────────┐
│  Desenvolvedor trabalha em branch feature (ex: victor#115)  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Abre Pull Request para DEV                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  CI: dev-pr-ci.yml    │
         │  ✓ Build Backend      │
         │  ✓ Build Frontend     │
         │  ✓ Lint               │
         │  ⚠ Testes (opcional)  │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Se CI passou: Merge permitido → DEV                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         (múltiplos PRs mergeados na DEV)
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Fim da Sprint: Abre Pull Request DEV → MAIN                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  CI: main-pr-ci.yml   │
         │  ✓ Build Backend      │
         │  ✓ Build Frontend     │
         │  ✓ Lint               │
         │  ✓ Docker Build       │
         │  ✓ Docker Compose     │
         │  ✅ Testes OBRIGATÓRIOS│
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Se CI passou: Merge permitido → MAIN (Release)             │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Branches

O CI foi configurado para se alinhar com a estratégia de branches da equipe:

- **Branches feature** (`victor#115`, `pedro#120`, etc.): Desenvolvimento individual
- **Branch `dev`**: Integração contínua das features (CI mais permissivo)
- **Branch `main`**: Branch de produção/release (CI mais rigoroso)

---

## Preparação para Testes (Sprint 2)

Como vocês vão implementar TDD nesta sprint, aqui está como preparar o projeto:

### Backend (Python/FastAPI)

1. **Criar estrutura de testes**:
```
backend/
├── tests/
│   ├── __init__.py
│   ├── test_user_service.py
│   ├── test_residue_service.py
│   ├── test_scheduling_service.py
│   └── test_endpoints.py
```

2. **Exemplo de teste básico** (`tests/test_user_service.py`):
```python
import pytest
from src.service.user_service import UserService

@pytest.mark.asyncio
async def test_criar_usuario():
    # Arrange
    user_data = {
        "nome": "Teste",
        "email": "teste@example.com",
        "papel": "produtor"
    }
    
    # Act
    resultado = await UserService.criar_usuario(user_data)
    
    # Assert
    assert resultado is not None
    assert resultado["email"] == "teste@example.com"
```

3. **Dependências necessárias** (já incluídas no workflow):
```bash
pip install pytest pytest-asyncio httpx
```

### Frontend (React/TypeScript)

1. **Adicionar scripts de teste no `package.json`**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

2. **Criar estrutura de testes**:
```
frontend/
├── src/
│   ├── components/
│   │   ├── UserForm.tsx
│   │   └── __tests__/
│   │       └── UserForm.test.tsx
```

3. **Exemplo de teste básico**:
```typescript
import { render, screen } from '@testing-library/react';
import { UserForm } from '../UserForm';

describe('UserForm', () => {
  it('deve renderizar o formulário corretamente', () => {
    render(<UserForm />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
  });
});
```

---

## Verificando o Status do CI

### No GitHub

1. Vá até a aba **Pull Requests**
2. Abra o PR desejado
3. Role até a seção **Checks** no final da página
4. Você verá:
   - ✅ **Backend - Build e Testes**: Status do backend
   - ✅ **Frontend - Build e Lint**: Status do frontend
   - ✅ **Verificação de Integração**: Status geral

### Na linha de comando

Para testar localmente antes de fazer push:

```bash
# Backend
cd backend
python -m py_compile server.py
pytest tests/ -v

# Frontend
cd frontend
npm run lint
npm run build
npm test
```

---

## Troubleshooting

### Problema: CI falha com "No tests found"

**Para DEV**: O workflow permite continuar (warning apenas)
**Para MAIN**: O workflow bloqueia o merge

**Solução**: Implementar testes antes de fazer PR para main

---

### Problema: Erro de linting no frontend

**Causa comum**: Código não segue as regras do ESLint

**Solução**:
```bash
cd frontend
npm run lint -- --fix  # Tenta corrigir automaticamente
```

---

### Problema: Docker build falha

**Verificar localmente**:
```bash
# Testar backend
cd backend
docker build -t test-backend .

# Testar frontend
cd frontend
docker build -t test-frontend .

# Testar docker-compose completo
docker compose build
docker compose up
```

---

### Problema: Cache do GitHub Actions desatualizado

**Solução**: Adicione `[skip cache]` no commit message ou limpe o cache manualmente nas configurações do repositório

---

## Próximos Passos (Futuro)

- [ ] Adicionar workflow de deploy automático (CD)
- [ ] Implementar análise de cobertura de testes
- [ ] Adicionar notificações no Discord/Slack quando CI falhar
- [ ] Implementar testes E2E (end-to-end)
- [ ] Adicionar análise de segurança (dependabot, SAST)

---

## Referências

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

---

**Última atualização**: Sprint 2 - Novembro 2025
**Responsáveis**: Equipe ReciclaAI (Gabriel, José Victor, Pedro Emanuel, Thalys)

# Guia Rápido: Testando o CI Localmente

Este guia mostra como testar as verificações do CI antes de fazer push/PR.

## 🚀 Instalação Inicial

### Backend
```bash
cd backend
pip install -r requirements.txt
pip install pytest pytest-asyncio httpx
```

### Frontend
```bash
cd frontend
npm install
```

---

## ✅ Checklist Antes do PR

### Para PRs → DEV

Execute estes comandos antes de criar o PR:

#### Backend
```bash
cd backend

# 1. Verificar sintaxe Python
python -m py_compile server.py

# 2. Rodar testes (quando implementados)
pytest tests/ -v
```

#### Frontend
```bash
cd frontend

# 1. Verificar linting
npm run lint

# 2. Fazer build
npm run build

# 3. Rodar testes (quando implementados)
npm test
```

#### Docker Compose
```bash
# Da raiz do projeto
docker compose config
```

---

### Para PRs → MAIN (além dos checks acima)

#### Testar Docker Builds
```bash
# Backend
cd backend
docker build -t reciclaai-backend:test .

# Frontend
cd frontend
docker build -t reciclaai-frontend:test .

# Docker Compose completo
cd ..
docker compose build
docker compose up -d
docker compose ps
docker compose down
```

---

## 🐛 Correções Rápidas

### Erro de Linting (Frontend)
```bash
cd frontend
npm run lint -- --fix
```

### Erro de Build (Frontend)
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Limpar Cache Docker
```bash
docker system prune -af
docker volume prune -f
```

---

## 📊 Ver Resultados do CI no GitHub

1. Vá para o seu Pull Request
2. Role até o final da página
3. Clique em "Details" ao lado de cada check
4. Veja os logs completos

---

## 💡 Dicas

- ✅ Execute os comandos localmente ANTES de fazer push
- ✅ Corrija erros de linting antes de criar PR
- ✅ Certifique-se de que o build passa localmente
- ✅ Para PRs → main, teste o Docker também
- ✅ Implemente testes antes de fazer PR para main

---

## 🔄 Workflow Recomendado

```bash
# 1. Trabalhe na sua branch feature
git checkout -b victor#115

# 2. Faça suas alterações
# ... código ...

# 3. Antes de commitar, teste localmente
cd backend && pytest tests/ -v && cd ..
cd frontend && npm run lint && npm run build && cd ..

# 4. Se tudo passou, commit e push
git add .
git commit -m "feat: implementa funcionalidade X"
git push origin victor#115

# 5. Crie o PR no GitHub
# O CI rodará automaticamente!
```

---

## ❓ FAQ

**Q: O CI está demorando muito, posso pular?**
A: Não. O CI garante qualidade do código. Se está demorando, otimize os testes localmente primeiro.

**Q: Posso fazer merge mesmo com CI falhando?**
A: Para DEV, depende do tipo de falha. Para MAIN, não - o CI deve passar.

**Q: Como atualizar as dependências do CI?**
A: Edite os arquivos `.github/workflows/*.yml` e faça commit.

---

Criado na Sprint 2 - ReciclaAI

# ReciclaAI Backend


## Sistema de Autenticação JWT

**Implementado:** Autenticação JWT com cookies HTTP-only

Este backend implementa um sistema completo de autenticação baseado em **JWT com cookies HTTP-only**, garantindo máxima segurança contra ataques XSS e CSRF.

### Início Rápido

```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(32))"  # Gerar JWT_SECRET_KEY

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Iniciar servidor
uvicorn server:app --reload

# 4. Testar
python test_auth.py
```

### Documentação Completa

- **[Guia de Início Rápido](QUICK_START.md)** - 5 passos para começar
- **[Guia Completo de Autenticação](AUTH_README.md)** - Documentação detalhada
- **[Arquitetura](ARQUITETURA_AUTH.md)** - Diagramas e fluxos
- **[Comandos Úteis](COMANDOS_UTEIS.md)** - Referência de comandos
- **[Checklist de Produção](PRODUCAO_CHECKLIST.md)** - Deploy em produção
- **[Índice Geral](INDICE_DOCUMENTACAO.md)** - Navegação completa

### Endpoints de Autenticação

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/auth/login` | POST | Login com e-mail/telefone e senha |
| `/auth/logout` | POST | Logout e revogação de tokens |
| `/auth/refresh` | POST | Renovação de access token |
| `/auth/me` | GET | Dados do usuário autenticado |
| `/users` | POST | Cadastro de novo usuário |

**Swagger UI:** http://localhost:8000/docs

---

## Grupo 3 - Engenharia de Software II (2025.2)

### Integrantes
* Gabriel Lopes Bastos (G4brielLB)
* José Victor Vieira de Oliveira (vickminari)
* Pedro Emanuel Moreira Carvalho (PedroEmanuelMoreiraCarvalho)
* Thalys Yago Silva Nascimento (ThalysYago)

## Arquitetura de banco de dados (MongoDB)

Este projeto está preparado para dois cenários:

- Desenvolvimento local com MongoDB como serviço Docker (imagem oficial mongo:7)
- Conexão futura (ou opcional) com MongoDB Atlas, alternando via variáveis de ambiente

### Como funciona a alternância (chave seletora)

- `USE_ATLAS=false` ➜ backend conecta no Mongo local do docker-compose via `MONGO_URI_LOCAL`.
- `USE_ATLAS=true`  ➜ backend utiliza a URI do MongoDB Atlas (`MONGO_URI_ATLAS`).
- Compatibilidade: se você já usa uma variável única `MONGO_URI`, ela ainda é aceita como fallback.

Arquivo que implementa a lógica: `backend/src/infra/database/config/database.py`.

### Serviços no docker-compose

Arquivo: `docker-compose.yml`

- `backend` (FastAPI)
	- Depende do serviço `mongodb` em ambiente de desenvolvimento
	- Lê variáveis de `backend/.env`
- `mongodb` (apenas dev)
	- `mongo:7`, credenciais padrão: `admin/admin123`
	- Persistência local em `./data/db`
- `frontend` e `frontend-dev` (Vite) permanecem inalterados

### Variáveis de ambiente

Arquivo de exemplo: `backend/.env.example`

- `USE_ATLAS`: `true|false` (padrão: `false`)
- `MONGO_URI_LOCAL`: `mongodb://admin:admin123@mongodb:27017/ReciclaAi?authSource=admin`
- `MONGO_URI_ATLAS`: ex.: `mongodb+srv://<user>:<pass>@.../ReciclaAi?...`
- `DB_NAME`: nome do banco. Padrão: `ReciclaAi`
- `MONGO_APP_NAME`: nome da aplicação reportado ao driver

Em desenvolvimento, o arquivo `backend/.env` já está configurado para usar o Mongo local.

### Subir ambiente de desenvolvimento

1. Verifique `backend/.env` com `USE_ATLAS=false`.
2. Na raiz `recicla-ai_devs-da-gama`, execute:

```
docker compose up --build
```

Endpoints úteis:

- `GET http://localhost:8000/health` ➜ status do backend
- `GET http://localhost:8000/db/ping` ➜ verifica conectividade com o Mongo

Dados persistem em `recicla-ai_devs-da-gama/data/db` (git-ignored).

### Usando Atlas (opcional / futuro)

1. Edite `backend/.env`:
	 - `USE_ATLAS=true`
	 - Defina `MONGO_URI_ATLAS` com sua string SRV
2. Suba os serviços:

```
docker compose up --build
```

Se preferir não subir o Mongo local neste cenário:

```
docker compose up --build --scale mongodb=0
```

### Rodando o backend fora do Docker (opcional)

Se executar o FastAPI localmente, use `localhost` na URI:

- `mongodb://admin:admin123@localhost:27017/ReciclaAi?authSource=admin`

### Troubleshooting

- `db_ping` retorna erro logo após iniciar: o Mongo pode ainda estar inicializando; aguarde alguns segundos e tente novamente.
- Porta 27017 ocupada: pare outro serviço Mongo local ou altere a porta mapeada em `docker-compose.yml`.
- Conexão Atlas falha: confirme IP liberado na Network Access do Atlas e credenciais corretas.

### Futuras melhorias sugeridas

- Separar arquivos de compose: `docker-compose.dev.yml` (com Mongo local) e `docker-compose.prod.yml` (sem Mongo e com variáveis obrigatórias para Atlas).
- Healthcheck no serviço `mongodb` e inicialização do backend com wait-for (para garantir readiness).
- Usuários/roles de banco não padrão para ambientes (evitar admin em dev, usar menos privilégios em prod).
- Adicionar testes de integração simples exercitando `get_database()` e uma coleção dummy.

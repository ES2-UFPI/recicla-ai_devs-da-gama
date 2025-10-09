# Frontend - ReciclaAi

> Este diretório contém o código-fonte do frontend da aplicação, desenvolvido com **React**, **Vite**, **TypeScript**, **Material-UI (MUI)** e containerizado com **Docker**.

---

## ⚙️ Pré-requisitos

Certifique-se de ter instalado:

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## 🚀 Configuração Inicial

### Variáveis de Ambiente

Este projeto utiliza arquivos `.env` para configuração. Crie os arquivos na raiz de `frontend/` a partir do exemplo:

```bash
# Crie o arquivo para o ambiente de desenvolvimento
cp .env.example .env.development

# Crie o arquivo para o ambiente de produção
cp .env.example .env.production
```

- `.env.development`: Usado ao rodar `docker-compose up frontend-dev`. Configure a `VITE_API_BASE_URL` para apontar para o backend em desenvolvimento (ex: `http://localhost:8000`).
- `.env.production`: Usado durante o build de produção (`docker-compose build frontend`). Geralmente, a `VITE_API_BASE_URL` é um caminho relativo (ex: `/api`).

---

## 🐳 Comandos Essenciais Docker

> Todos os comandos devem ser executados a partir do diretório raiz do projeto (onde está o `docker-compose.yml`).

### Subindo o Ambiente de Desenvolvimento

> Este é o comando que você usará 99% do tempo. Ele sobe apenas o container de desenvolvimento com hot-reload.

```bash
# Sobe o container em primeiro plano (logs no terminal)
docker-compose up frontend-dev

# Ou, para rodar em segundo plano (detached mode)
docker-compose up -d frontend-dev
```

Após executar, acesse: [http://localhost:5173](http://localhost:5173)

### Parando os Containers

Para parar os containers e remover os volumes associados (limpeza completa):

```bash
docker-compose down
```

### Construindo as Imagens Docker

Normalmente, o `docker-compose up --build` já faz isso, mas você pode construir as imagens separadamente:

```bash
# Constrói todas as imagens
docker-compose build

# Constrói a imagem de desenvolvimento
docker-compose build frontend-dev

# Constrói a imagem de produção
docker-compose build frontend
```

### Visualizando Logs

Se você subiu o container em modo `-d`, visualize os logs em tempo real:

```bash
docker-compose logs -f frontend-dev
```

---

## 💡 Fluxo de Trabalho e Boas Práticas

### Regra de Ouro

> Quando estiver usando Docker, o **container é o seu ambiente de desenvolvimento**. Todos os comandos que modificam o ambiente (como instalar pacotes) devem ser executados **dentro do container**.

### Gerenciando Dependências (Pacotes NPM) 📦

> **NÃO** use `npm install` diretamente no seu terminal local.

#### Para instalar um novo pacote:

Use `docker-compose exec` para rodar o comando dentro do container:

```bash
# Exemplo: instalando o pacote 'date-fns'
docker-compose exec frontend-dev npm install date-fns
```

#### Para desinstalar um pacote:

```bash
# Exemplo: desinstalando o pacote 'date-fns'
docker-compose exec frontend-dev npm uninstall date-fns
```

> Esse fluxo garante que o pacote seja instalado no ambiente correto (Linux Alpine do container) e que seus arquivos `package.json` e `package-lock.json` locais sejam atualizados automaticamente.

---

## 🏗️ Desenvolvimento vs. Produção

- Durante o desenvolvimento, rode apenas o container `frontend-dev`.
- O container `frontend` (produção) serve apenas para build e pré-visualização da versão final otimizada.

#### Como aplicar as mudanças para a versão de produção?

> O container `frontend-dev` usa seu código-fonte diretamente. O container `frontend` usa o resultado do processo de build (`npm run build`), que gera arquivos estáticos otimizados.

Para atualizar a versão de produção:

```bash
# 1. Garanta que todas as suas mudanças foram salvas.
# 2. Reconstrua a imagem de produção.
docker-compose build frontend

# 3. Suba o container de produção para pré-visualizar.
docker-compose up frontend
```

Acesse: [http://localhost:4173](http://localhost:4173)

---

## 📝 Outras Boas Práticas

### Commits Semânticos

Tente seguir um padrão para as mensagens de commit. Isso organiza o histórico do projeto. Exemplos:

- `feat`: adiciona tela de login (nova funcionalidade)
- `fix`: corrige bug no alinhamento do botão (correção de bug)
- `docs`: atualiza o README com novas instruções (mudanças na documentação)
- `style`: ajusta formatação do código (mudanças que não afetam a lógica)
- `refactor`: melhora a lógica do componente de card (refatoração de código)
- `chore`: adiciona nova dependência (mudanças de build, pacotes, etc.)
- Sempre coloque o número da issue em que você está trabalhando no nome do commit "#XX" e faça o push para a branch seu-nome#XX

### Variáveis de Ambiente

- Nunca envie arquivos `.env` para o repositório. O `.gitignore` já está configurado para ignorá-los.
- Mantenha o `.env.example` atualizado com todas as variáveis necessárias para rodar o projeto.

### Código Limpo

- Configure seu editor (VSCode, etc.) para usar as regras do ESLint e Prettier do projeto. Isso manterá o código padronizado e livre de erros comuns.
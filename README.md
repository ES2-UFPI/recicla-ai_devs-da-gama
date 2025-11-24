# ReciclaAI

Plataforma web responsiva que conecta produtores, coletores e receptores de resíduos recicláveis, incentivando a reciclagem através de um sistema de recompensas e logística integrada.

## Acesso à Aplicação

A aplicação está disponível online em: **https://reciclaai-frontend.vercel.app/**

## Descrição

O ReciclaAI é uma solução completa para gerenciamento de resíduos recicláveis que promove transparência no processo de reciclagem e fornece métricas de impacto socioambiental. O sistema permite que produtores solicitem coletas, coletores realizem a logística e receptores recebam os materiais, tudo coordenado por uma plataforma gamificada com sistema de pontos e recompensas.

## Arquitetura

O projeto utiliza uma arquitetura em camadas baseada no padrão MVC expandido (View - Controller - Service - Model), organizada em módulos principais:

- **Módulo de Usuários**: Gestão de perfis (produtores, coletores, receptores) com padrão Builder
- **Módulo de Resíduos**: Registro e categorização de materiais recicláveis
- **Módulo de Logística**: Agendamento e gerenciamento de coletas
- **Módulo de Recompensas**: Sistema de pontos e gamificação
- **Módulo de Relatórios**: Métricas e indicadores socioambientais

## Tecnologias

### Backend
- Python 3.11+
- FastAPI
- MongoDB (Motor ODM)
- JWT para autenticação
- PyTest para testes
- Hospedagem: Render

### Frontend
- React 19
- TypeScript
- Vite
- Material-UI (MUI)
- React Router
- Leaflet para mapas
- Hospedagem: Vercel

### Banco de Dados
- MongoDB Atlas (cloud)

## Requisitos

- Docker e Docker Compose
- Python 3.11 ou superior (para desenvolvimento local)
- Node.js 18+ (para desenvolvimento local)

## Ambientes

### Produção
- **Frontend**: https://reciclaai-frontend.vercel.app/
- **Backend**: Hospedado no Render
- **Banco de Dados**: MongoDB Atlas

### Desenvolvimento Local

#### Usando Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/ES2-UFPI/recicla-ai_devs-da-gama.git
cd recicla-ai_devs-da-gama

# Inicie os containers
docker-compose up
```

A aplicação estará disponível em:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Documentação da API: http://localhost:8000/docs
- MongoDB: localhost:27017

#### Backend

```bash
cd backend

# Crie e ative o ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
.\venv\Scripts\activate  # Windows

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env

# Execute o servidor
uvicorn server:app --reload
```

#### Frontend

```bash
cd frontend

# Instale as dependências
npm install

# Execute o servidor de desenvolvimento
npm run dev
```

## Testes

```bash
cd backend
pytest tests/
```

## Tipos de Usuários

### Produtor
- Gera resíduos e solicita coletas
- Acumula pontos por reciclagem
- Pode ser pessoa física ou jurídica (CNPJ)

### Coletor
- Realiza coletas de resíduos
- Gerencia inventário de materiais coletados
- Intermedia entregas aos receptores

### Receptor
- Ponto de coleta que recebe resíduos
- Define tipos de materiais aceitos
- Localização fixa para entregas

## Estrutura do Projeto

```
recicla-ai_devs-da-gama/
├── backend/
│   ├── src/
│   │   ├── builders/      # Padrão Builder para usuários
│   │   ├── infra/         # Configuração de banco de dados
│   │   ├── routers/       # Endpoints da API
│   │   ├── schemas/       # Modelos Pydantic
│   │   └── service/       # Lógica de negócios
│   ├── tests/             # Testes unitários
│   └── server.py          # Ponto de entrada
├── frontend/
│   └── src/
│       ├── components/    # Componentes React
│       ├── pages/         # Páginas da aplicação
│       ├── services/      # Integração com API
│       └── ...
├── data/
│   └── db/                # Volume do MongoDB (desenvolvimento)
└── docker-compose.yml
```

## Autenticação

O sistema utiliza tokens JWT armazenados em cookies HTTP-only para autenticação segura. Todas as comunicações entre cliente e servidor são realizadas via HTTPS em produção.

## Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
2. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
3. Push para a branch (`git push origin feature/nova-feature`)
4. Abra um Pull Request

## Licença

Este projeto foi desenvolvido como parte da disciplina de Engenharia de Software 2 da UFPI.

## Autores

[Gabriel Lopes](https://github.com/G4brielLB)
[José Victor](https://github.com/vickminari)
[Pedro Emanuel](https://github.com/PedroEmanuelMoreiraCarvalho)
[Thalys Yago](https://github.com/ThalysYago)

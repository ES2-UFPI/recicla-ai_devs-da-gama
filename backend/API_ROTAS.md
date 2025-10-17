# 📚 Documentação de Rotas da API - ReciclaAI

> **Base URL:** `http://localhost:8000`

Esta documentação lista todas as rotas disponíveis no backend da aplicação ReciclaAI, incluindo métodos HTTP, endpoints, autenticação necessária, corpo de requisição e exemplos de resposta.

---

## 📑 Índice

- [Rotas Públicas](#rotas-públicas)
- [Autenticação](#autenticação)
- [Usuários](#usuários)
- [Resíduos](#resíduos)
- [Categorias](#categorias)
- [Agendamentos](#agendamentos)
- [Desenvolvimento](#desenvolvimento)

---

## 🌐 Rotas Públicas

### Health Check
**GET** `http://localhost:8000/health`

Verifica se a API está funcionando.

**Autenticação:** Não requerida

**Resposta de Sucesso:**
```json
{
  "status": "ok"
}
```

---

### Ping MongoDB
**GET** `http://localhost:8000/db/ping`

Verifica a conexão com o banco de dados MongoDB.

**Autenticação:** Não requerida

**Resposta de Sucesso:**
```json
{
  "ok": 1,
  "message": "Conexão com MongoDB bem-sucedida.",
  "details": {
    "ok": 1
  }
}
```

---

## 🔐 Autenticação

Todas as rotas de autenticação utilizam cookies HTTP-only para armazenar tokens JWT.

### Login
**POST** `http://localhost:8000/auth/login`

Autentica o usuário e retorna tokens JWT em cookies.

**Autenticação:** Não requerida

**Corpo da Requisição:**
```json
{
  "credential": "joao.silva@example.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "name": "João Silva",
    "email": "joao.silva@example.com",
    "role_id": "produtor",
    "addresses": []
  }
}
```

**Observações:**
- O campo `credential` aceita e-mail ou telefone
- Tokens são armazenados em cookies HTTP-only (access_token e refresh_token)

---

### Logout
**POST** `http://localhost:8000/auth/logout`

Faz logout do usuário, revogando os tokens e removendo cookies.

**Autenticação:** Não requerida (permite logout mesmo com token expirado)

**Resposta de Sucesso (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

### Refresh Token
**POST** `http://localhost:8000/auth/refresh`

Renova o access token usando o refresh token.

**Autenticação:** Requer refresh_token em cookie

**Resposta de Sucesso (200):**
```json
{
  "message": "Token renovado com sucesso"
}
```

**Resposta de Erro (401):**
```json
{
  "detail": "Refresh token não encontrado."
}
```

---

### Obter Usuário Autenticado
**GET** `http://localhost:8000/auth/me`

Retorna informações do usuário atualmente autenticado.

**Autenticação:** ✅ Requerida (access_token em cookie)

**Resposta de Sucesso (200):**
```json
{
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "role_id": "produtor",
  "addresses": []
}
```

---

## 👥 Usuários

### Criar Usuário
**POST** `http://localhost:8000/users`

Cria um novo usuário no sistema (registro).

**Autenticação:** Não requerida

**Corpo da Requisição:**
```json
{
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "phone": "(99) 99999-9999",
  "password": "Senha123!",
  "role_id": "produtor",
  "cidade_id": "cidade_id_exemplo",
  "estado_id": "estado_id_exemplo",
  "addresses": [
    {
      "apelido": "Casa",
      "cep": "12345-678",
      "logradouro": "Rua A",
      "numero": "123",
      "latitude": "-23.5505",
      "longitude": "-46.6333",
      "complemento": "Apto 101"
    }
  ]
}
```

**Requisitos de Senha:**
- Mínimo 8 caracteres
- Pelo menos 1 número
- Pelo menos 1 letra maiúscula
- Pelo menos 1 caractere especial (!, @, #, $, %, &, *)

**Observação sobre endereços:**
- O campo `apelido` é opcional nos endereços
- O ID do endereço é gerado automaticamente de forma incremental (1, 2, 3...)
- Cada usuário tem sua própria numeração de endereços

**Resposta de Sucesso (201):**
```json
{
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "role_id": "produtor",
  "addresses": [
    {
      "id": 1,
      "apelido": "Casa",
      "cep": "12345-678",
      "logradouro": "Rua A",
      "numero": "123",
      "latitude": "-23.5505",
      "longitude": "-46.6333",
      "complemento": "Apto 101"
    }
  ]
}
```

---

### Obter Usuário por ID
**GET** `http://localhost:8000/users/{user_id}`

Recupera dados de um usuário específico por ID.

**Autenticação:** Não requerida

**Exemplo:** `http://localhost:8000/users/60c72b2f9b1d4c3a4c8e4d3a`

**Resposta de Sucesso (200):**
```json
{
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "role_id": "produtor",
  "addresses": []
}
```

---

### Obter Usuário por E-mail
**GET** `http://localhost:8000/users/email/{email}`

Recupera dados de um usuário por e-mail.

**Autenticação:** Não requerida

**Exemplo:** `http://localhost:8000/users/email/joao.silva@example.com`

**Resposta de Sucesso (200):**
```json
{
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "role_id": "produtor",
  "addresses": []
}
```

---

### Obter Meu Perfil
**GET** `http://localhost:8000/users/me`

Retorna o perfil do usuário autenticado.

**Autenticação:** ✅ Requerida

**Resposta de Sucesso (200):**
```json
{
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "role_id": "produtor",
  "addresses": []
}
```

---

### Atualizar Meu Perfil
**PUT** `http://localhost:8000/users/me`

Atualiza dados do usuário autenticado.

**Autenticação:** ✅ Requerida

**Corpo da Requisição (todos os campos são opcionais):**
```json
{
  "name": "João da Silva",
  "email": "novo.email@example.com",
  "phone": "(88) 88888-8888",
  "password": "NovaSenha123!"   // Ainda será implementado um "Esqueci minha senha"
}
```

**Resposta de Sucesso (200):**
```json
{
  "name": "João da Silva",
  "email": "novo.email@example.com",
  "role_id": "produtor",
  "addresses": []
}
```

---

### Listar Meus Endereços
**GET** `http://localhost:8000/users/me/addresses`

Lista todos os endereços do usuário autenticado.

**Autenticação:** ✅ Requerida

**Resposta de Sucesso (200):**
```json
[
  {
    "id": 1,
    "apelido": "Casa",
    "cep": "12345-678",
    "logradouro": "Rua A",
    "numero": "123",
    "latitude": "-23.5505",
    "longitude": "-46.6333",
    "complemento": "Apto 101"
  },
  {
    "id": 2,
    "apelido": "Trabalho",
    "cep": "98765-432",
    "logradouro": "Av. Principal",
    "numero": "500",
    "latitude": "-23.5600",
    "longitude": "-46.6400",
    "complemento": "Sala 10"
  }
]
```

---

### Adicionar Endereço
**POST** `http://localhost:8000/users/me/addresses`

Adiciona um novo endereço ao usuário autenticado.

**Autenticação:** ✅ Requerida

**Corpo da Requisição:**
```json
{
  "apelido": "Trabalho",
  "cep": "98765-432",
  "logradouro": "Av. Principal",
  "numero": "500",
  "latitude": "-23.5600",
  "longitude": "-46.6400",
  "complemento": "Sala 10"
}
```

**Observações:**
- O campo `apelido` é opcional
- O ID do endereço é gerado automaticamente (incremental)
- Não envie o campo `id` no corpo da requisição

**Resposta de Sucesso (201):**
```json
{
  "message": "Endereço adicionado com sucesso.",
  "id": 3
}
```

---

### Atualizar Endereço
**PUT** `http://localhost:8000/users/me/addresses/{address_id}`

Atualiza um endereço existente do usuário.

**Autenticação:** ✅ Requerida

**Exemplo:** `http://localhost:8000/users/me/addresses/1`

**Parâmetro de Path:**
- `address_id`: ID numérico do endereço (ex: 1, 2, 3)

**Corpo da Requisição (campos opcionais):**
```json
{
  "apelido": "Casa Nova",
  "cep": "11111-111",
  "logradouro": "Rua Nova",
  "numero": "999",
  "complemento": "Bloco A"
}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Endereço ID 1 atualizado com sucesso."
}
```

---

### Remover Endereço
**DELETE** `http://localhost:8000/users/me/addresses/{address_id}`

Remove um endereço do usuário.

**Autenticação:** ✅ Requerida

**Exemplo:** `http://localhost:8000/users/me/addresses/1`

**Parâmetro de Path:**
- `address_id`: ID numérico do endereço (ex: 1, 2, 3)

**Resposta de Sucesso (200):**
```json
{
  "message": "Endereço ID 1 removido com sucesso."
}
```

---

## ♻️ Resíduos

### Criar Resíduo
**POST** `http://localhost:8000/residuos/`

Cria um novo resíduo (apenas para produtores).

**Autenticação:** ✅ Requerida (role: produtor)

**Corpo da Requisição:**
```json
{
  "quantidade": 10,
  "tipo_medida": "unidade",
  "foto": "http://example.com/garrafas.jpg",
  "categoriaId": "60c72b2f9b1d4c3a4c8e4d3e"
}
```

**Campos:**
- `quantidade`: valor positivo (kg ou unidades)
- `tipo_medida`: "kg" ou "unidade"
- `foto`: URL da imagem (opcional)
- `categoriaId`: ID da categoria válida e ativa

**Resposta de Sucesso (201):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
  "categoriaId": "60c72b2f9b1d4c3a4c8e4d3b",
  "quantidade": 10,
  "tipo_medida": "unidade",
  "foto": "http://example.com/garrafas.jpg",
  "valorEstimado": 1.50,
  "status": "DISPONIVEL",
  "dataCadastro": "2025-10-14T10:30:00Z"
}
```

---

### Listar Meus Resíduos
**GET** `http://localhost:8000/residuos/meus-residuos`

Lista todos os resíduos do produtor autenticado.

**Autenticação:** ✅ Requerida

**Parâmetros de Query (opcionais):**
- `skip`: número de registros a pular (padrão: 0)
- `limit`: máximo de registros (padrão: 100, máx: 500)

**Exemplo:** `http://localhost:8000/residuos/meus-residuos?skip=0&limit=10`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "60c72b2f9b1d4c3a4c8e4d3e",
    "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
    "categoriaId": "60c72b2f9b1d4c3a4c8e4d3b",
    "quantidade": 10,
    "tipo_medida": "unidade",
    "foto": "http://example.com/garrafas.jpg",
    "valorEstimado": 1.50,
    "status": "DISPONIVEL",
    "dataCadastro": "2025-10-14T10:30:00Z"
  }
]
```

---

### Obter Resíduo por ID
**GET** `http://localhost:8000/residuos/{residuo_id}`

Obtém detalhes de um resíduo específico (apenas o dono pode acessar).

**Autenticação:** ✅ Requerida

**Exemplo:** `http://localhost:8000/residuos/60c72b2f9b1d4c3a4c8e4d3e`

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
  "categoriaId": "60c72b2f9b1d4c3a4c8e4d3b",
  "quantidade": 10,
  "tipo_medida": "unidade",
  "foto": "http://example.com/garrafas.jpg",
  "valorEstimado": 1.50,
  "status": "DISPONIVEL",
  "dataCadastro": "2025-10-14T10:30:00Z"
}
```

---

### Atualizar Resíduo
**PUT** `http://localhost:8000/residuos/{residuo_id}`

Atualiza dados de um resíduo (apenas o dono pode atualizar).

**Autenticação:** ✅ Requerida

**Exemplo:** `http://localhost:8000/residuos/60c72b2f9b1d4c3a4c8e4d3e`

**Corpo da Requisição (todos os campos são opcionais):**
```json
{
  "quantidade": 15.0,
  "tipo_medida": "unidade",
  "foto": "http://example.com/foto_atualizada.jpg",
  "categoriaId": "60c72b2f9b1d4c3a4c8e4d3f"
}
```

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
  "categoriaId": "60c72b2f9b1d4c3a4c8e4d3f",
  "quantidade": 15.0,
  "tipo_medida": "unidade",
  "foto": "http://example.com/foto_atualizada.jpg",
  "valorEstimado": 2.25,
  "status": "DISPONIVEL",
  "dataCadastro": "2025-10-14T10:30:00Z"
}
```

---

### Deletar Resíduo
**DELETE** `http://localhost:8000/residuos/{residuo_id}`

Deleta um resíduo (apenas o dono pode deletar).

**Autenticação:** ✅ Requerida

**Exemplo:** `http://localhost:8000/residuos/60c72b2f9b1d4c3a4c8e4d3e`

**Observação:** Não é possível deletar resíduos com status COLETADO ou ENTREGUE.

**Resposta de Sucesso (204):**
```
No Content
```

**Resposta de Erro (400):**
```json
{
  "detail": "Não é possível deletar resíduos que já foram coletados ou entregues"
}
```

---

### Obter Histórico do Resíduo
**GET** `http://localhost:8000/residuos/{residuo_id}/historico`

Retorna a linha do tempo completa de um resíduo.

**Autenticação:** ✅ Requerida

**Exemplo:** `http://localhost:8000/residuos/60c72b2f9b1d4c3a4c8e4d3e/historico`

**Resposta de Sucesso (200):**
```json
[
  {
    "acao": "CRIADO",
    "data": "2025-10-14T10:30:00Z",
    "usuarioId": "60c72b2f9b1d4c3a4c8e4d3a",
    "detalhes": "Resíduo cadastrado no sistema"
  },
  {
    "acao": "AGENDADO",
    "data": "2025-10-15T14:00:00Z",
    "usuarioId": "60c72b2f9b1d4c3a4c8e4d3c",
    "detalhes": "Coleta agendada"
  }
]
```

---

### Atualizar Status do Resíduo
**PATCH** `http://localhost:8000/residuos/{residuo_id}/status`

Atualiza o status de um resíduo (usado principalmente pela logística).

**Autenticação:** ✅ Requerida

**Exemplo:** `http://localhost:8000/residuos/60c72b2f9b1d4c3a4c8e4d3e/status`

**Corpo da Requisição:**
```json
{
  "status": "COLETADO",
  "detalhes": "Resíduo coletado pelo coletor João"
}
```

**Status possíveis:**
- DISPONIVEL
- AGENDADO
- COLETADO
- ENTREGUE
- CANCELADO

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
  "categoriaId": "60c72b2f9b1d4c3a4c8e4d3b",
  "quantidade": 10,
  "tipo_medida": "unidade",
  "foto": "http://example.com/garrafas.jpg",
  "valorEstimado": 1.50,
  "status": "COLETADO",
  "dataCadastro": "2025-10-14T10:30:00Z"
}
```

---

## 📦 Categorias

### Listar Categorias Ativas (Público)
**GET** `http://localhost:8000/categorias/ativas`

Lista todas as categorias ativas disponíveis para seleção.

**Autenticação:** Não requerida (endpoint público)

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "60c72b2f9b1d4c3a4c8e4d3e",
    "tipo": "Plástico",
    "descricao": "Garrafas PET, sacolas plásticas, embalagens",
    "preco_por_kg": 2.50,
    "preco_por_unidade": null,
    "ativo": true
  },
  {
    "id": "60c72b2f9b1d4c3a4c8e4d3f",
    "tipo": "Vidro",
    "descricao": "Garrafas, potes, frascos de vidro",
    "preco_por_kg": 0.80,
    "preco_por_unidade": 0.15,
    "ativo": true
  }
]
```

---

### Listar Todas as Categorias (Admin)
**GET** `http://localhost:8000/categorias/`

Lista TODAS as categorias (ativas e inativas) - apenas administradores.

**Autenticação:** ✅ Requerida (role: admin)

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "60c72b2f9b1d4c3a4c8e4d3e",
    "tipo": "Plástico",
    "descricao": "Garrafas PET, sacolas plásticas, embalagens",
    "preco_por_kg": 2.50,
    "preco_por_unidade": null,
    "ativo": true
  },
  {
    "id": "60c72b2f9b1d4c3a4c8e4d3f",
    "tipo": "Isopor",
    "descricao": "Embalagens de isopor",
    "preco_por_kg": 1.00,
    "preco_por_unidade": null,
    "ativo": false
  }
]
```

---

### Obter Categoria por ID
**GET** `http://localhost:8000/categorias/{categoria_id}`

Retorna detalhes de uma categoria específica.

**Autenticação:** ✅ Requerida

**Exemplo:** `http://localhost:8000/categorias/60c72b2f9b1d4c3a4c8e4d3e`

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "tipo": "Plástico",
  "descricao": "Garrafas PET, sacolas plásticas, embalagens",
  "preco_por_kg": 2.50,
  "preco_por_unidade": null,
  "ativo": true
}
```

---

### Criar Categoria (Admin)
**POST** `http://localhost:8000/categorias/`

Cria uma nova categoria - apenas administradores.

**Autenticação:** ✅ Requerida (role: admin)

**Corpo da Requisição:**
```json
{
  "tipo": "Bateria",
  "descricao": "Pilhas e baterias recarregáveis de todos os tipos",
  "preco_por_kg": 10.00,
  "preco_por_unidade": 2.00,
  "ativo": true
}
```

**Validações:**
- `tipo`: 3-50 caracteres, não pode estar duplicado
- `descricao`: 10-500 caracteres
- `preco_por_kg`: maior que 0
- `preco_por_unidade`: maior que 0 (opcional)

**Resposta de Sucesso (201):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d40",
  "tipo": "Bateria",
  "descricao": "Pilhas e baterias recarregáveis de todos os tipos",
  "preco_por_kg": 10.00,
  "preco_por_unidade": 2.00,
  "ativo": true
}
```

---

### Atualizar Categoria (Admin)
**PUT** `http://localhost:8000/categorias/{categoria_id}`

Atualiza dados de uma categoria - apenas administradores.

**Autenticação:** ✅ Requerida (role: admin)

**Exemplo:** `http://localhost:8000/categorias/60c72b2f9b1d4c3a4c8e4d3e`

**Corpo da Requisição (todos os campos são opcionais):**
```json
{
  "tipo": "Plástico Reciclável",
  "descricao": "Garrafas PET, sacolas plásticas, embalagens de produtos de limpeza",
  "preco_por_kg": 3.00,
  "ativo": true
}
```

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "tipo": "Plástico Reciclável",
  "descricao": "Garrafas PET, sacolas plásticas, embalagens de produtos de limpeza",
  "preco_por_kg": 3.00,
  "preco_por_unidade": null,
  "ativo": true
}
```

---

### Atualizar Preço da Categoria (Admin)
**PATCH** `http://localhost:8000/categorias/{categoria_id}/preco?novo_preco=3.50`

Atualiza apenas o preço de uma categoria - apenas administradores.

**Autenticação:** ✅ Requerida (role: admin)

**Exemplo:** `http://localhost:8000/categorias/60c72b2f9b1d4c3a4c8e4d3e/preco?novo_preco=3.50`

**Parâmetros de Query:**
- `novo_preco`: novo valor por kg (obrigatório, > 0)

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "tipo": "Plástico",
  "descricao": "Garrafas PET, sacolas plásticas, embalagens",
  "preco_por_kg": 3.50,
  "preco_por_unidade": null,
  "ativo": true
}
```

---

### Desativar Categoria (Admin)
**DELETE** `http://localhost:8000/categorias/{categoria_id}`

Desativa uma categoria (soft delete) - apenas administradores.

**Autenticação:** ✅ Requerida (role: admin)

**Exemplo:** `http://localhost:8000/categorias/60c72b2f9b1d4c3a4c8e4d3e`

**Observação:** A categoria não é deletada, apenas marcada como inativa.

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "tipo": "Plástico",
  "descricao": "Garrafas PET, sacolas plásticas, embalagens",
  "preco_por_kg": 2.50,
  "preco_por_unidade": null,
  "ativo": false
}
```

---

### Reativar Categoria (Admin)
**POST** `http://localhost:8000/categorias/{categoria_id}/reativar`

Reativa uma categoria previamente desativada - apenas administradores.

**Autenticação:** ✅ Requerida (role: admin)

**Exemplo:** `http://localhost:8000/categorias/60c72b2f9b1d4c3a4c8e4d3e/reativar`

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "tipo": "Plástico",
  "descricao": "Garrafas PET, sacolas plásticas, embalagens",
  "preco_por_kg": 2.50,
  "preco_por_unidade": null,
  "ativo": true
}
```

---

## 📅 Agendamentos

### Criar Agendamento
**POST** `http://localhost:8000/schedules/`

Cria um novo agendamento de coleta.

**Autenticação:** ✅ Requerida (role: produtor)

**Regras de Autorização:**
- ✅ **Produtor:** Pode criar (produtorId é obtido automaticamente do token)
- ❌ **Coletor/Reciclador:** Bloqueado
- ✅ **Admin:** Pode criar para qualquer produtor

**Corpo da Requisição:**
```json
{
  "residuosId": ["60c72b2f9b1d4c3a4c8e4d3e", "60c72b2f9b1d4c3a4c8e4d3f"],
  "disponibilidade": [
    {
      "data": "20/10/2025",
      "hora_inicio": "10:30",
      "hora_fim": "18:00"
    },
    {
      "data": "21/10/2025",
      "hora_inicio": "11:00",
      "hora_fim": "17:00"
    }
  ],
  "address_id": 1,
  "observacoes": "Deixar os resíduos na portaria."
}
```

**Campos:**
- `residuosId`: Array com IDs dos resíduos a serem coletados
- `disponibilidade`: Array de slots de disponibilidade (mínimo 1 slot)
- `address_id`: **ID do endereço do produtor** a ser usado na coleta (deve existir no perfil)
- `observacoes`: Instruções adicionais (opcional)

**Estrutura de Disponibilidade:**
- `data`: formato `dd/mm/aaaa` (ex: `20/10/2025`)
- `hora_inicio`: formato `hh:mm` (ex: `10:30`)
- `hora_fim`: formato `hh:mm` (ex: `18:00`)

**Validações Automáticas:**
- ✅ Formato de data e hora
- ✅ Hora de início < hora de fim
- ✅ Hora de início não pode estar muito no passado (tolerância: 30 minutos)
- ✅ Pelo menos 1 slot de disponibilidade obrigatório
- ✅ `address_id` deve existir no perfil do produtor

**Resposta de Sucesso (201):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d50",
  "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
  "residuosId": ["60c72b2f9b1d4c3a4c8e4d3e", "60c72b2f9b1d4c3a4c8e4d3f"],
  "disponibilidade": [
    {
      "data": "20/10/2025",
      "hora_inicio": "10:30",
      "hora_fim": "18:00"
    },
    {
      "data": "21/10/2025",
      "hora_inicio": "11:00",
      "hora_fim": "17:00"
    }
  ],
  "local": {
    "address_id": 1,
    "apelido": "Casa",
    "cep": "64000-000",
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "complemento": "Apto 101",
    "latitude": "-5.0892",
    "longitude": "-42.8019"
  },
  "status": "PENDENTE",
  "observacoes": "Deixar os resíduos na portaria."
}
```

**Estrutura do Campo `local`:**
O backend busca automaticamente os dados completos do endereço a partir do `address_id`:
- `address_id`: ID de referência do endereço
- `apelido`: Apelido do endereço (opcional)
- `cep`: CEP do endereço
- `logradouro`: Nome da rua/avenida
- `numero`: Número do imóvel
- `complemento`: Complemento (opcional)
- `latitude`: Coordenada para mapas (opcional)
- `longitude`: Coordenada para mapas (opcional)

**Observações:**
- O endereço é salvo como **snapshot** no agendamento
- Se o produtor alterar/deletar o endereço no perfil, o agendamento mantém os dados originais
- Cooperativas visualizam o endereço completo diretamente no agendamento

**Erros Comuns:**

**403 - Apenas produtores podem criar:**
```json
{
  "detail": "Apenas produtores podem criar agendamentos"
}
```

**422 - Formato de data inválido:**
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "disponibilidade", 0, "data"],
      "msg": "Value error, Data deve estar no formato dd/mm/aaaa (ex: 17/10/2025)"
    }
  ]
}
```

**422 - Horário de início >= fim:**
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "disponibilidade"],
      "msg": "Value error, Erro no slot 1: Horário de início (18:00) deve ser anterior ao horário de fim (10:00)"
    }
  ]
}
```

**404 - Endereço não encontrado:**
```json
{
  "detail": "Endereço com ID 5 não encontrado no perfil do produtor"
}
```

---

### Obter Agendamento por ID
**GET** `http://localhost:8000/schedules/{scheduling_id}`

Retorna detalhes de um agendamento específico.

**Autenticação:** ✅ Requerida

**Regras de Autorização:**
- ✅ **Produtor:** Pode ver apenas seus próprios agendamentos
- ✅ **Coletor/Reciclador:** Pode ver qualquer agendamento (para aceitar coletas)
- ✅ **Admin:** Pode ver qualquer agendamento

**Exemplo:** `http://localhost:8000/schedules/60c72b2f9b1d4c3a4c8e4d50`

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d50",
  "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
  "residuosId": ["60c72b2f9b1d4c3a4c8e4d3e"],
  "disponibilidade": [
    {
      "data": "20/10/2025",
      "hora_inicio": "10:00",
      "hora_fim": "17:00"
    }
  ],
  "local": {
    "address_id": 1,
    "apelido": "Casa",
    "cep": "64000-000",
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "complemento": "Apto 101",
    "latitude": "-5.0892",
    "longitude": "-42.8019"
  },
  "status": "PENDENTE",
  "observacoes": "Deixar na portaria"
}
```

**Erro 403 - Produtor tentando ver agendamento de outro:**
```json
{
  "detail": "Você só pode visualizar seus próprios agendamentos"
}
```

---

### Listar Agendamentos
**GET** `http://localhost:8000/schedules/`

Lista agendamentos com filtros opcionais.

**Autenticação:** ✅ Requerida

**Regras de Autorização:**
- ✅ **Produtor:** Lista **apenas seus próprios** agendamentos (filtro `produtorId` é **ignorado**)
- ✅ **Coletor/Reciclador:** Lista **todos** os agendamentos (pode filtrar por `produtorId`)
- ✅ **Admin:** Lista todos os agendamentos

**Parâmetros de Query (todos opcionais):**
- `produtorId`: filtrar por produtor (ignorado para produtores)
- `residuoId`: filtrar por resíduo
- `status`: filtrar por status (PENDENTE, ACEITO, CANCELADO)
- `skip`: paginação - registros a pular (padrão: 0)
- `limit`: paginação - máximo de registros (padrão: 100, máx: 500)

**Exemplo:** `http://localhost:8000/schedules/?status=PENDENTE&limit=10`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "60c72b2f9b1d4c3a4c8e4d50",
    "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
    "residuosId": ["60c72b2f9b1d4c3a4c8e4d3e"],
    "disponibilidade": [
      {
        "data": "20/10/2025",
        "hora_inicio": "10:00",
        "hora_fim": "17:00"
      }
    ],
    "local": {
      "address_id": 1,
      "apelido": "Casa",
      "cep": "64000-000",
      "logradouro": "Rua Exemplo",
      "numero": "123",
      "complemento": "Apto 101",
      "latitude": "-5.0892",
      "longitude": "-42.8019"
    },
    "status": "PENDENTE",
    "observacoes": null
  }
]
```

**Observações:**
- Produtores veem apenas seus próprios agendamentos (segurança automática)
- Coletores veem todos os agendamentos disponíveis para aceitar coletas

---

### Atualizar Agendamento
**PUT** `http://localhost:8000/schedules/{schedulingId}`

Atualiza agendamento existente.

**Autenticação:** ✅ Requerida

**Regras de Autorização:**
- ✅ **Produtor:** Pode atualizar **apenas seus próprios** agendamentos
- ❌ **Coletor/Reciclador:** **NÃO PODEM** atualizar agendamentos (use `PATCH /schedules/{schedulingId}/status`)
- ✅ **Admin:** Pode atualizar qualquer agendamento

**Exemplo:** `http://localhost:8000/schedules/60c72b2f9b1d4c3a4c8e4d50`

**Body (JSON) - todos os campos opcionais:**
```json
{
  "residuosId": ["60c72b2f9b1d4c3a4c8e4d3e"],
  "disponibilidade": [
    {
      "data": "25/10/2025",
      "hora_inicio": "09:00",
      "hora_fim": "18:00"
    }
  ],
  "address_id": 2,
  "observacoes": "Observação atualizada"
}
```

**Campos opcionais:**
- `residuosId`: Atualizar lista de resíduos
- `disponibilidade`: Atualizar slots de disponibilidade
- `address_id`: **Alterar endereço da coleta** (usa outro endereço do perfil do produtor)
- `observacoes`: Atualizar observações

**Validações de Disponibilidade:**
- ✅ **data:** formato `dd/mm/aaaa` (ex: 20/10/2025)
- ✅ **hora_inicio e hora_fim:** formato `hh:mm` (ex: 10:00)
- ✅ **Lógica:** `hora_inicio` < `hora_fim`
- ✅ **Temporal:** Data/hora **não pode ser no passado** (tolerância: 30 minutos)

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d50",
  "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
  "residuosId": ["60c72b2f9b1d4c3a4c8e4d3e"],
  "disponibilidade": [
    {
      "data": "25/10/2025",
      "hora_inicio": "09:00",
      "hora_fim": "18:00"
    }
  ],
  "local": {
    "address_id": 2,
    "apelido": "Trabalho",
    "cep": "64001-000",
    "logradouro": "Av. Principal",
    "numero": "500",
    "complemento": "Sala 10",
    "latitude": "-5.0920",
    "longitude": "-42.8050"
  },
  "status": "PENDENTE",
  "observacoes": "Observação atualizada"
}
```

**Erros Comuns:**

**403 Forbidden** - Coletor tentando atualizar:
```json
{
  "detail": "Coletores e recicladores não podem editar agendamentos"
}
```

**403 Forbidden** - Produtor tentando atualizar agendamento de outro produtor:
```json
{
  "detail": "Você não tem permissão para acessar este agendamento"
}
```

**422 Unprocessable Entity** - Formato de data inválido:
```json
{
  "detail": [
    {
      "loc": ["body", "disponibilidade", 0, "data"],
      "msg": "Data deve estar no formato dd/mm/aaaa (ex: 20/10/2025)",
      "type": "value_error"
    }
  ]
}
```

**422 Unprocessable Entity** - hora_inicio >= hora_fim:
```json
{
  "detail": [
    {
      "loc": ["body", "disponibilidade", 0],
      "msg": "hora_inicio (18:00) deve ser menor que hora_fim (09:00)",
      "type": "value_error"
    }
  ]
}
```

**Observações:**
- Coletores devem usar `PATCH /schedules/{schedulingId}/status` para aceitar/cancelar
- Apenas o produtor proprietário pode editar seus agendamentos

---

### Atualizar Status do Agendamento
**PATCH** `http://localhost:8000/schedules/{schedulingId}/status`

Atualiza apenas o status de um agendamento.

**Autenticação:** ✅ Requerida

**Regras de Autorização:**
- ✅ **Produtor:** Pode atualizar status **apenas de seus próprios** agendamentos
- ✅ **Coletor:** Pode atualizar status de **qualquer** agendamento (para aceitar/cancelar coletas)
- ❌ **Reciclador:** Não pode atualizar status
- ✅ **Admin:** Pode atualizar status de qualquer agendamento

**Exemplo:** `http://localhost:8000/schedules/60c72b2f9b1d4c3a4c8e4d50/status`

**Corpo da Requisição:**
```json
{
  "status": "ACEITO"
}
```

**Status possíveis:**
- `PENDENTE`
- `ACEITO`
- `CANCELADO`

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d50",
  "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
  "residuosId": ["60c72b2f9b1d4c3a4c8e4d3e"],
  "disponibilidade": [
    {
      "data": "20/10/2025",
      "hora_inicio": "10:00",
      "hora_fim": "17:00"
    }
  ],
  "local": {
    "address_id": 1,
    "apelido": "Casa",
    "cep": "64000-000",
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "complemento": "Apto 101",
    "latitude": "-5.0892",
    "longitude": "-42.8019"
  },
  "status": "ACEITO",
  "observacoes": null
}
```

**Erros Comuns:**

**403 Forbidden** - Produtor tentando atualizar status de agendamento de outro:
```json
{
  "detail": "Você não tem permissão para acessar este agendamento"
}
```

**Observações:**
- Coletores usam este endpoint para aceitar coletas agendadas por produtores
- Produtores podem cancelar seus próprios agendamentos

---

### Deletar Agendamento
**DELETE** `http://localhost:8000/schedules/{schedulingId}`

Deleta um agendamento.

**Autenticação:** ✅ Requerida

**Regras de Autorização:**
- ✅ **Produtor:** Pode deletar **apenas seus próprios** agendamentos
- ❌ **Coletor/Reciclador:** **NÃO PODEM** deletar agendamentos
- ✅ **Admin:** Pode deletar qualquer agendamento

**Exemplo:** `http://localhost:8000/schedules/60c72b2f9b1d4c3a4c8e4d50`

**Resposta de Sucesso (204):**
```
No Content
```

**Erros Comuns:**

**403 Forbidden** - Coletor tentando deletar:
```json
{
  "detail": "Coletores e recicladores não podem deletar agendamentos"
}
```

**403 Forbidden** - Produtor tentando deletar agendamento de outro produtor:
```json
{
  "detail": "Você não tem permissão para acessar este agendamento"
}
```

**Observações:**
- Coletores devem cancelar agendamentos via `PATCH /schedules/{schedulingId}/status` (status: CANCELADO)
- Apenas o produtor proprietário pode deletar permanentemente seus agendamentos

---

## 🔧 Desenvolvimento

⚠️ **ATENÇÃO:** Estas rotas devem ser DESABILITADAS em produção!

### Popular Categorias Padrão
**GET** `http://localhost:8000/dev/seed/categorias`

Popula o banco com as categorias padrão do sistema (Plástico, Vidro, Papel, Metal, Eletrônico).

**Autenticação:** Não requerida

**Resposta de Sucesso (200):**
```json
{
  "ok": 1,
  "criadas": [
    {
      "tipo": "Vidro",
      "id": "671234...",
      "preco_kg": 0.8,
      "preco_unidade": 0.15
    }
  ],
  "ja_existentes": ["Plástico"],
  "erros": [],
  "total_criadas": 4,
  "total_existentes": 1,
  "total_erros": 0,
  "mensagem": "✅ Seed concluído! 4 criadas, 1 já existiam."
}
```

---

### Limpar Todas as Categorias
**GET** `http://localhost:8000/dev/seed/limpar-categorias`

⚠️⚠️⚠️ **PERIGO:** Remove TODAS as categorias do banco de dados!

**Autenticação:** Não requerida

**Resposta de Sucesso (200):**
```json
{
  "ok": 1,
  "deletadas": 5,
  "mensagem": "🗑️ 5 categorias removidas do banco."
}
```

---

### Informações de Desenvolvimento
**GET** `http://localhost:8000/dev/info`

Retorna informações sobre os endpoints de desenvolvimento disponíveis.

**Autenticação:** Não requerida

**Resposta de Sucesso (200):**
```json
{
  "endpoints": {
    "GET /dev/seed/categorias": "Popula categorias padrão (Plástico, Vidro, Papel, Metal, Eletrônico)",
    "GET /dev/seed/limpar-categorias": "⚠️ Remove TODAS as categorias do banco",
    "GET /dev/info": "Exibe esta mensagem de ajuda"
  },
  "aviso": "⚠️ Estes endpoints são apenas para DESENVOLVIMENTO. Desabilite em produção!",
  "categorias_padrao": ["Plástico", "Vidro", "Papel", "Metal", "Eletrônico"],
  "total_categorias": 5
}
```

---

## 📌 Observações Importantes

### Autenticação
- A API usa cookies HTTP-only para armazenar tokens JWT
- Tokens de acesso expiram em 15 minutos
- Tokens de refresh expiram em 7 dias
- Sempre envie `credentials: 'include'` nas requisições do frontend

### Controle de Acesso
- **Produtores:** podem criar e gerenciar resíduos
- **Coletores/Logística:** podem atualizar status de resíduos e agendamentos
- **Administradores:** têm acesso completo, incluindo gerenciamento de categorias

### Códigos de Status HTTP
- `200 OK` - Sucesso
- `201 Created` - Recurso criado com sucesso
- `204 No Content` - Sucesso sem corpo de resposta
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro no servidor

### Formato de Datas
Todas as datas seguem o formato ISO 8601: `YYYY-MM-DDTHH:mm:ssZ`

---

## 🧪 Testando com Postman

### Configuração Inicial
1. Importe as rotas no Postman
2. Configure a variável de ambiente `baseUrl` como `http://localhost:8000`
3. Habilite cookies automáticos nas configurações

### Fluxo de Teste Básico
1. **Criar usuário:** POST `/users`
2. **Fazer login:** POST `/auth/login` (cookies serão salvos automaticamente)
3. **Verificar autenticação:** GET `/auth/me`
4. **Listar categorias:** GET `/categorias/ativas`
5. **Criar resíduo:** POST `/residuos/`
6. **Listar meus resíduos:** GET `/residuos/meus-residuos`

---

**Documentação gerada em:** 16 de outubro de 2025  
**Versão da API:** 0.1.0  
**Desenvolvido por:** Equipe Devs da Gama - ReciclaAI

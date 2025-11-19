# 📚 Documentação de Rotas da API - ReciclaAI

> **Base URL:** `http://localhost:8000`

Esta documentação lista todas as rotas disponíveis no backend da aplicação ReciclaAI, incluindo métodos HTTP, endpoints, autenticação necessária, corpo de requisição e exemplos de resposta.

---

## Arquitetura de Usuários - User Builders

O sistema implementa o **padrão Builder** para construção de usuários, garantindo validação e type-safety específica para cada role:

### Tipos de Usuários (Roles)

#### **Produtor** (`role_id: "produtor"`)
- **Responsabilidade:** Gera resíduos e solicita coletas
- **Builder:** `ProdutorBuilder`
- **Campos Específicos:**
  - `is_business`: boolean (empresa ou pessoa física)
  - `cnpj`: string (obrigatório se `is_business = true`)
  - `points`: int (pontos de gamificação)
  - `ranking`: int (posição no ranking)
- **Validações:**
  - Deve ter pelo menos 1 endereço para solicitar coletas
  - CNPJ obrigatório quando `is_business = true`

#### **Coletor** (`role_id: "coletor"`)
- **Responsabilidade:** Realiza coletas de resíduos
- **Builder:** `ColetorBuilder`
- **Campos Específicos:**
  - `inventory`: list[string] (IDs de resíduos fisicamente coletados - status COLETADO)
- **Validações:**
  - Inventory deve ser uma lista válida
  - Inventory é atualizado automaticamente ao coletar/cancelar resíduos

#### **Receptor** (`role_id: "receptor"`)
- **Responsabilidade:** Ponto de coleta que recebe resíduos
- **Builder:** `ReceptorBuilder`
- **Campos Específicos:**
  - `accepted_material`: list[string] (tipos de materiais aceitos)
- **Validações:**
  - Deve ter pelo menos 1 endereço (ponto de coleta fixo)
  - Deve especificar pelo menos 1 tipo de material aceito

### Vantagens do User Builder Pattern

✅ **Type-Safety:** Cada builder garante campos obrigatórios específicos  
✅ **Validação Automática:** Regras de negócio validadas antes de persistir  
✅ **Flexibilidade:** Fácil adicionar novos tipos de usuários  
✅ **Manutenibilidade:** Lógica de construção centralizada e reutilizável  

---

## Índice

- [Arquitetura de Usuários](#arquitetura-de-usuários---user-builders)
- [Rotas Públicas](#rotas-públicas)
- [Autenticação](#autenticação)
- [Usuários](#usuários)
- [Resíduos](#resíduos)
- [Categorias](#categorias)
- [Agendamentos](#agendamentos)
- [Coletas](#coletas)
- [Entregas](#entregas)
- [Recompensas](#recompensas)
- [Desenvolvimento](#desenvolvimento)

---

## Rotas Públicas

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

## Autenticação

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

## Usuários

### Criar Usuário
**POST** `http://localhost:8000/users`

Cria um novo usuário no sistema (registro) utilizando **User Builders** específicos para cada role.

**Autenticação:** Não requerida

**Arquitetura:**
O sistema utiliza o padrão **Builder Pattern** para construir usuários de forma type-safe:
- `ProdutorBuilder` - para produtores de resíduos
- `ColetorBuilder` - para coletores
- `ReceptorBuilder` - para pontos de coleta

Cada builder valida campos obrigatórios específicos da role antes de persistir.

---

#### Criar Produtor

**Campos Obrigatórios:**
- `name`, `email`, `phone`, `password`
- `role_id`: deve ser `"produtor"`
- `addresses`: **obrigatório** (mínimo 1 endereço para solicitar coletas)
- `cidade_id`, `estado_id`

**Campos Específicos de Produtor:**
- `is_business`: `boolean` (True = empresa, False = pessoa física)
  - Se `is_business = true`, então `cnpj` é **obrigatório**
- `cnpj`: `string` (CNPJ da empresa)
- `points`: `int` (pontos de gamificação, padrão: 0)
- `ranking`: `int` (posição no ranking, padrão: 0)

**Exemplo - Produtor Pessoa Física:**
```json
{
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "phone": "(99) 99999-9999",
  "password": "Senha123!",
  "role_id": "produtor",
  "cidade_id": "cidade_123",
  "estado_id": "estado_456",
  "is_business": false,
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

**Exemplo - Produtor Empresa:**
```json
{
  "name": "Empresa ABC Ltda",
  "email": "contato@empresaabc.com",
  "phone": "(11) 98888-7777",
  "password": "Senha123!",
  "role_id": "produtor",
  "cidade_id": "cidade_123",
  "estado_id": "estado_456",
  "is_business": true,
  "cnpj": "12.345.678/0001-90",
  "addresses": [
    {
      "apelido": "Matriz",
      "cep": "12345-678",
      "logradouro": "Av. Principal",
      "numero": "1000",
      "latitude": "-23.5505",
      "longitude": "-46.6333"
    }
  ]
}
```

---

#### Criar Coletor

**Campos Obrigatórios:**
- `name`, `email`, `phone`, `password`
- `role_id`: deve ser `"coletor"`
- `cidade_id`, `estado_id`

**Campos Específicos de Coletor:**
- `inventory`: `list[string]` (lista de IDs de resíduos fisicamente coletados, gerenciado automaticamente, padrão: [])
- `addresses`: opcional (coletores podem ter endereços, mas não é obrigatório)

**Observação:** O campo `inventory` é gerenciado automaticamente pelo sistema:
- Resíduos são adicionados ao inventory quando coletados (ação `coletar_residuo`)
- Resíduos são removidos do inventory quando a coleta é cancelada após iniciar
- Resíduos rejeitados NUNCA entram no inventory (não foram fisicamente coletados)

**Exemplo - Coletor:**
```json
{
  "name": "Maria Coletora",
  "email": "maria.coletora@example.com",
  "phone": "(11) 97777-6666",
  "password": "Senha123!",
  "role_id": "coletor",
  "cidade_id": "cidade_123",
  "estado_id": "estado_456",
  "inventory": [],
  "addresses": [
    {
      "apelido": "Base de Operações",
      "cep": "98765-432",
      "logradouro": "Rua B",
      "numero": "456",
      "latitude": "-23.5600",
      "longitude": "-46.6400"
    }
  ]
}
```

---

#### Criar Receptor

**Campos Obrigatórios:**
- `name`, `email`, `phone`, `password`
- `role_id`: deve ser `"receptor"`
- `addresses`: **obrigatório** (mínimo 1 endereço - ponto de coleta fixo)
- `accepted_material`: **obrigatório** (lista com pelo menos 1 tipo de material aceito)
- `cidade_id`, `estado_id`

**Campos Específicos de Receptor:**
- `accepted_material`: `list[string]` (ex: ["plástico", "papel", "metal", "vidro", "eletrônico"])

**Exemplo - Receptor:**
```json
{
  "name": "EcoPonto Central",
  "email": "contato@ecoponto.com",
  "phone": "(11) 96666-5555",
  "password": "Senha123!",
  "role_id": "receptor",
  "cidade_id": "cidade_123",
  "estado_id": "estado_456",
  "accepted_material": ["plástico_id", "papel_id", "metal_id", "vidro_id"],
  "addresses": [
    {
      "apelido": "Ponto de Coleta Principal",
      "cep": "11111-222",
      "logradouro": "Av. Reciclagem",
      "numero": "500",
      "latitude": "-23.5700",
      "longitude": "-46.6500",
      "complemento": "Galpão 3"
    }
  ]
}
```

---

**Requisitos de Senha (todos os roles):**
- Mínimo 8 caracteres
- Pelo menos 1 número
- Pelo menos 1 letra maiúscula
- Pelo menos 1 caractere especial (!, @, #, $, %, &, *)

**Observações sobre Endereços:**
- O campo `apelido` é opcional nos endereços
- O campo `id` é gerado automaticamente de forma incremental (1, 2, 3...)
- Cada usuário tem sua própria numeração de endereços
- **Não envie** o campo `id` no corpo da requisição ao criar endereços

**Validações Automáticas (User Builders):**
- ✅ Email único no sistema
- ✅ Senha hash com bcrypt_sha256
- ✅ Campos obrigatórios por role
- ✅ CNPJ obrigatório se `is_business = true`
- ✅ Receptor deve ter endereço e materiais aceitos
- ✅ Produtor deve ter pelo menos um endereço

**Resposta de Sucesso (201):**

⚠️ **Importante:** A resposta contém apenas dados públicos do usuário através do schema `UserPublic`. Informações sensíveis como `password_hash` e campos internos **não são retornados**.

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

> **Nota:** Campos específicos da role (como `points`, `ranking`, `inventory`, `accepted_material`) **não são retornados** na resposta pública por questões de segurança e privacidade. Esses dados são armazenados no banco de dados, mas não expostos publicamente.

**Respostas de Erro:**

**400 Bad Request** - Role inválida:
```json
{
  "detail": "Role 'admin' não suportado. Use: produtor, coletor ou receptor."
}
```

**400 Bad Request** - Validação de campos específicos:
```json
{
  "detail": "CNPJ é obrigatório quando is_business é True"
}
```

**400 Bad Request** - Produtor sem endereço:
```json
{
  "detail": "Produtor deve ter pelo menos um endereço cadastrado"
}
```

**400 Bad Request** - Receptor sem materiais aceitos:
```json
{
  "detail": "Receptor deve especificar ao menos um tipo de material aceito"
}
```

**409 Conflict** - Email duplicado:
```json
{
  "detail": "E-mail já cadastrado."
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

Atualiza dados do usuário autenticado utilizando **User Builders**.

**Autenticação:** ✅ Requerida

**Importante:** O sistema detecta automaticamente o tipo de usuário (Produtor, Coletor ou Receptor) e aplica as validações específicas através dos builders correspondentes.

**Corpo da Requisição (todos os campos são opcionais):**

**Campos Comuns (todos os roles):**
```json
{
  "name": "João da Silva",
  "email": "novo.email@example.com",
  "phone": "(88) 88888-8888",
  "password": "NovaSenha123!",
  "cidade_id": "nova_cidade_123",
  "estado_id": "novo_estado_456"
}
```

**Campos Específicos de Produtor:**
```json
{
  "is_business": true,
  "cnpj": "98.765.432/0001-10",
  "points": 150,
  "ranking": 5
}
```

**Campos Específicos de Coletor:**
```json
{
  "inventory": ["residuo_id_1", "residuo_id_2"]
}
```

**Campos Específicos de Receptor:**
```json
{
  "accepted_material": ["plástico", "papel", "metal", "vidro", "eletrônico"]
}
```

**Exemplo Completo - Atualizar Produtor:**
```json
{
  "name": "João da Silva Empresário",
  "phone": "(11) 99999-8888",
  "is_business": true,
  "cnpj": "98.765.432/0001-10"
}
```

**Validações Automáticas (User Builders):**
- ✅ Se alterar email, verifica unicidade no sistema
- ✅ Se Produtor alterar `is_business` para `true`, valida presença de `cnpj`
- ✅ Senha é automaticamente hasheada com bcrypt_sha256
- ✅ Campos específicos são validados conforme a role do usuário

**Observação:** Não é possível alterar o `role_id` de um usuário após a criação.

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

## Resíduos

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

### Obter Resíduo por ID (Coletor)
**GET** `http://localhost:8000/residuos/coletor/{residuo_id}`

Obtém detalhes de um resíduo específico (apenas coletores).

**Autenticação:** ✅ Requerida (role: coletor)

**Regras:**
- Apenas coletores podem acessar
- Permite visualizar qualquer resíduo para fins de coleta
- Não há restrição de propriedade

**Exemplo:** `http://localhost:8000/residuos/coletor/60c72b2f9b1d4c3a4c8e4d3e`

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
  "categoriaId": "60c72b2f9b1d4c3a4c8e4d3b",
  "quantidade": 10,
  "tipo_medida": "kg",
  "foto": "http://example.com/garrafas.jpg",
  "valorEstimado": 25.00,
  "status": "AGENDADO",
  "dataCadastro": "2025-10-14T10:30:00Z"
}
```

**Erros Comuns:**

**403 Forbidden** - Usuário não é coletor:
```json
{
  "detail": "Apenas coletores podem acessar este endpoint"
}
```

**404 Not Found** - Resíduo não encontrado:
```json
{
  "detail": "Resíduo não encontrado"
}
```

**Observações:**
- Este endpoint é específico para coletores visualizarem resíduos durante o processo de coleta
- Não há validação de propriedade, permitindo acesso a qualquer resíduo
- Útil para visualizar detalhes durante a execução de uma coleta

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

## Categorias

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

## Agendamentos

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

### Buscar Agendamentos Disponíveis (Localização)
**POST** `http://localhost:8000/schedules/disponiveis`

Busca agendamentos PENDENTE disponíveis para coleta baseado em localização geográfica, horário atual e categorias de resíduos.

**Autenticação:** ✅ Requerida (role: coletor)

**Regras de Autorização:**
- ✅ **Coletor:** Pode buscar agendamentos disponíveis
- ❌ **Produtor/Reciclador/Admin:** Bloqueado

**Corpo da Requisição:**
```json
{
  "latitude": -5.0892,
  "longitude": -42.8019,
  "raio": 5.0,
  "data_busca": "22/10/2025",
  "hora_busca": "15:00",
  "categorias_ids": ["60c72b2f9b1d4c3a4c8e4d3e", "60c72b2f9b1d4c3a4c8e4d3f"]
}
```

**Campos:**
- `latitude`: Latitude da localização do coletor (número decimal)
- `longitude`: Longitude da localização do coletor (número decimal)
- `raio`: Raio de busca em quilômetros (0.1 a 100 km)
- `data_busca`: Data atual no formato `dd/mm/aaaa` (ex: `22/10/2025`)
- `hora_busca`: Hora atual no formato `hh:mm` (ex: `15:00`)
- `categorias_ids`: **Opcional** - Array de IDs de categorias para filtrar

**Funcionalidade:**

Este endpoint implementa busca geoespacial otimizada com 4 níveis de filtro:

1. ✅ **Status**: Apenas agendamentos PENDENTE
2. ✅ **Distância**: Dentro do raio especificado
3. ✅ **Horário**: Disponibilidade no momento atual
4. ✅ **Categorias**: Resíduos das categorias selecionadas (opcional)

**Algoritmo Otimizado:**
- Query geoespacial no MongoDB (cálculo de distância no banco)
- Fórmula de Haversine para distância em quilômetros
- Ordenado por distância (mais próximo primeiro)
- Máximo de 100 resultados
- Inclui dados completos dos resíduos

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "674a1b2c3d4e5f6g7h8i9j0k",
    "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
    "residuosId": ["60c72b2f9b1d4c3a4c8e4d3e"],
    "distancia_km": 0.87,
    "local": {
      "address_id": 1,
      "apelido": "Casa",
      "cep": "64000-000",
      "logradouro": "Rua das Flores",
      "numero": "123",
      "complemento": "Apto 101",
      "latitude": "-5.0900",
      "longitude": "-42.8025"
    },
    "disponibilidade": [
      {
        "data": "22/10/2025",
        "hora_inicio": "10:30",
        "hora_fim": "18:00"
      }
    ],
    "residuos": [
      {
        "id": "60c72b2f9b1d4c3a4c8e4d3e",
        "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
        "categoriaId": "60c72b2f9b1d4c3a4c8e4d3b",
        "quantidade": 5.0,
        "tipo_medida": "kg",
        "foto": "http://example.com/plastico.jpg",
        "valorEstimado": 12.50,
        "status": "DISPONIVEL",
        "dataCadastro": "2025-10-20T10:30:00Z"
      }
    ],
    "status": "PENDENTE",
    "observacoes": "Deixar na portaria"
  },
  {
    "id": "674a1b2c3d4e5f6g7h8i9j0l",
    "produtorId": "60c72b2f9b1d4c3a4c8e4d3b",
    "residuosId": ["60c72b2f9b1d4c3a4c8e4d3f"],
    "distancia_km": 2.34,
    "local": {
      "address_id": 2,
      "apelido": "Trabalho",
      "cep": "64001-000",
      "logradouro": "Av. Principal",
      "numero": "500",
      "complemento": null,
      "latitude": "-5.1100",
      "longitude": "-42.8200"
    },
    "disponibilidade": [
      {
        "data": "22/10/2025",
        "hora_inicio": "14:00",
        "hora_fim": "17:00"
      }
    ],
    "residuos": [
      {
        "id": "60c72b2f9b1d4c3a4c8e4d3f",
        "produtorId": "60c72b2f9b1d4c3a4c8e4d3b",
        "categoriaId": "60c72b2f9b1d4c3a4c8e4d3c",
        "quantidade": 10.0,
        "tipo_medida": "unidade",
        "foto": "http://example.com/metal.jpg",
        "valorEstimado": 25.00,
        "status": "DISPONIVEL",
        "dataCadastro": "2025-10-19T14:00:00Z"
      }
    ],
    "status": "PENDENTE",
    "observacoes": null
  }
]
```

**Campos Especiais na Resposta:**
- `distancia_km`: Distância em quilômetros da localização do coletor
- `residuos`: Array completo com dados de cada resíduo (inclui categoria, quantidade, foto, etc.)

**Erros Comuns:**

**403 Forbidden** - Usuário não é coletor:
```json
{
  "detail": "Apenas coletores podem buscar agendamentos disponíveis"
}
```

**422 Unprocessable Entity** - Formato de data inválido:
```json
{
  "detail": [
    {
      "loc": ["body", "data_busca"],
      "msg": "Data deve estar no formato dd/mm/aaaa (ex: 22/10/2025)",
      "type": "value_error"
    }
  ]
}
```

**422 Unprocessable Entity** - Raio fora do intervalo:
```json
{
  "detail": [
    {
      "loc": ["body", "raio"],
      "msg": "Input should be greater than or equal to 0.1",
      "type": "greater_than_equal"
    }
  ]
}
```

**Observações:**
- Lista vazia `[]` é retornada se não houver agendamentos no raio especificado
- Agendamentos são retornados ordenados por distância (mais próximo primeiro)
- Campo `categorias_ids` é opcional - omitir retorna todas as categorias
- Máximo de 100 agendamentos por consulta
- Performance otimizada: ~50-150ms para busca em 100k+ agendamentos

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

## Coletas

Gerenciamento do fluxo completo de coleta de resíduos pelos coletores.

### Aceitar Coleta
**POST** `http://localhost:8000/coletas/aceitar`

Coletor aceita um agendamento e reserva os resíduos selecionados.

**Autenticação:** ✅ Requerida (role: coletor)

**Regras:**
- Agendamento deve estar com status PENDENTE
- Todos os resíduos devem existir e estar AGENDADO
- Todos os resíduos devem pertencer ao agendamento
- Cria uma nova coleta em estado PENDENTE
- Atualiza resíduos para RESERVADO

**Corpo da Requisição:**
```json
{
  "agendamento_id": "60c72b2f9b1d4c3a4c8e4d3e",
  "residuos_ids": [
    "60c72b2f9b1d4c3a4c8e4d3f",
    "60c72b2f9b1d4c3a4c8e4d40"
  ]
}
```

**Resposta de Sucesso (201):**
```json
{
  "id": "674a1b2c3d4e5f6g7h8i9j0k",
  "agendamento_id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtor_id": "60c72b2f9b1d4c3a4c8e4d3a",
  "coletor_id": "60c72b2f9b1d4c3a4c8e4d3b",
  "residuos_id": [
    "60c72b2f9b1d4c3a4c8e4d3f",
    "60c72b2f9b1d4c3a4c8e4d40"
  ],
  "data_hora": "2025-10-22T14:30:00Z",
  "local": {
    "address_id": 1,
    "apelido": "Casa",
    "cep": "64000-000",
    "logradouro": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 101",
    "latitude": "-5.0892",
    "longitude": "-42.8019"
  },
  "observacoes": null,
  "estado": "PENDENTE"
}
```

**Erros Comuns:**

**403 Forbidden** - Usuário não é coletor:
```json
{
  "detail": "Apenas coletores podem aceitar coletas"
}
```

**404 Not Found** - Agendamento não encontrado:
```json
{
  "detail": "Agendamento não encontrado"
}
```

**400 Bad Request** - Agendamento não está PENDENTE:
```json
{
  "detail": "Agendamento não está PENDENTE"
}
```

**400 Bad Request** - Resíduo não pertence ao agendamento:
```json
{
  "detail": "Resíduo 60c72b2f9b1d4c3a4c8e4d3f não pertence ao agendamento"
}
```

---

### Iniciar Coleta
**PATCH** `http://localhost:8000/coletas/{coleta_id}/iniciar`

Marca a coleta como EM_ANDAMENTO (coletor chegou no local).

**Autenticação:** ✅ Requerida (role: coletor)

**Regras:**
- Coleta deve estar em estado PENDENTE
- Atualiza data_hora para o momento atual
- Muda estado para EM_ANDAMENTO
- **NOTA:** Resíduos são adicionados ao inventory apenas quando efetivamente coletados (ver `coletar-residuo`)

**Exemplo:** `http://localhost:8000/coletas/674a1b2c3d4e5f6g7h8i9j0k/iniciar`

**Resposta de Sucesso (200):**
```json
{
  "id": "674a1b2c3d4e5f6g7h8i9j0k",
  "agendamento_id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtor_id": "60c72b2f9b1d4c3a4c8e4d3a",
  "coletor_id": "60c72b2f9b1d4c3a4c8e4d3b",
  "residuos_id": [
    "60c72b2f9b1d4c3a4c8e4d3f",
    "60c72b2f9b1d4c3a4c8e4d40"
  ],
  "data_hora": "2025-10-22T15:00:00Z",
  "local": {
    "address_id": 1,
    "apelido": "Casa",
    "cep": "64000-000",
    "logradouro": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 101",
    "latitude": "-5.0892",
    "longitude": "-42.8019"
  },
  "observacoes": null,
  "estado": "EM_ANDAMENTO"
}
```

**Erros Comuns:**

**403 Forbidden** - Usuário não é o coletor da coleta:
```json
{
  "detail": "Você não tem permissão para iniciar esta coleta"
}
```

**400 Bad Request** - Coleta não está PENDENTE:
```json
{
  "detail": "Coleta não está no estado PENDENTE"
}
```

---

### Coletar Resíduo
**PATCH** `http://localhost:8000/coletas/{coleta_id}/coletar-residuo`

Marca um ou mais resíduos como COLETADO, mantém na lista da coleta e **adiciona ao inventory do coletor**.

**Autenticação:** ✅ Requerida (role: coletor)

**Regras:**
- Coleta deve estar EM_ANDAMENTO
- Todos os resíduos devem estar RESERVADO
- Todos os resíduos devem pertencer à coleta
- Atualiza resíduos para COLETADO
- **Adiciona resíduos coletados ao inventory do coletor** (resíduos fisicamente coletados)
- Mantém resíduos na lista `residuos_id`
- Verifica se todos resíduos foram finalizados (auto-conclusão do agendamento)

**Exemplo:** `http://localhost:8000/coletas/674a1b2c3d4e5f6g7h8i9j0k/coletar-residuo`

**Corpo da Requisição:**
```json
{
  "residuos_ids": [
    "60c72b2f9b1d4c3a4c8e4d3f",
    "60c72b2f9b1d4c3a4c8e4d40"
  ],
  "observacao": "Resíduos coletados em bom estado"
}
```

**Campos:**
- `residuos_ids`: Lista de IDs dos resíduos (obrigatório, mínimo 1)
- `observacao`: Observação sobre a coleta (opcional)

**Resposta de Sucesso (200):**
```json
{
  "id": "674a1b2c3d4e5f6g7h8i9j0k",
  "agendamento_id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtor_id": "60c72b2f9b1d4c3a4c8e4d3a",
  "coletor_id": "60c72b2f9b1d4c3a4c8e4d3b",
  "residuos_id": [
    "60c72b2f9b1d4c3a4c8e4d3f",
    "60c72b2f9b1d4c3a4c8e4d40"
  ],
  "data_hora": "2025-10-22T15:00:00Z",
  "local": {
    "address_id": 1,
    "apelido": "Casa",
    "cep": "64000-000",
    "logradouro": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 101",
    "latitude": "-5.0892",
    "longitude": "-42.8019"
  },
  "observacoes": "Resíduo coletado em bom estado",
  "estado": "EM_ANDAMENTO"
}
```

**Observações:**
- Os resíduos permanecem na lista `residuos_id` da coleta
- Sistema verifica automaticamente se todos os resíduos do agendamento foram finalizados
- Se todos foram coletados/rejeitados, o agendamento muda para CONCLUIDO
- É possível coletar múltiplos resíduos de uma só vez

---

### Rejeitar Resíduo
**PATCH** `http://localhost:8000/coletas/{coleta_id}/rejeitar-residuo`

Marca um ou mais resíduos como REJEITADO e remove da lista da coleta.

**Autenticação:** ✅ Requerida (role: coletor)

**Regras:**
- Coleta deve estar EM_ANDAMENTO
- Todos os resíduos devem estar RESERVADO
- Todos os resíduos devem pertencer à coleta
- Atualiza resíduos para REJEITADO
- Remove resíduos da lista `residuos_id`
- Motivo é obrigatório
- Verifica conclusão do agendamento

**Exemplo:** `http://localhost:8000/coletas/674a1b2c3d4e5f6g7h8i9j0k/rejeitar-residuo`

**Corpo da Requisição:**
```json
{
  "residuos_ids": [
    "60c72b2f9b1d4c3a4c8e4d40",
    "60c72b2f9b1d4c3a4c8e4d41"
  ],
  "motivo": "Materiais contaminados com óleo"
}
```

**Campos:**
- `residuos_ids`: Lista de IDs dos resíduos (obrigatório, mínimo 1)
- `motivo`: Motivo da rejeição, mínimo 3 caracteres (obrigatório)

**Resposta de Sucesso (200):**
```json
{
  "id": "674a1b2c3d4e5f6g7h8i9j0k",
  "agendamento_id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtor_id": "60c72b2f9b1d4c3a4c8e4d3a",
  "coletor_id": "60c72b2f9b1d4c3a4c8e4d3b",
  "residuos_id": [
    "60c72b2f9b1d4c3a4c8e4d3f"
  ],
  "data_hora": "2025-10-22T15:00:00Z",
  "local": {
    "address_id": 1,
    "apelido": "Casa",
    "cep": "64000-000",
    "logradouro": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 101",
    "latitude": "-5.0892",
    "longitude": "-42.8019"
  },
  "observacoes": "REJEITADO 60c72b2f9b1d4c3a4c8e4d40: Materiais contaminados com óleo\nREJEITADO 60c72b2f9b1d4c3a4c8e4d41: Materiais contaminados com óleo",
  "estado": "EM_ANDAMENTO"
}
```

**Observações:**
- Os resíduos são REMOVIDOS da lista `residuos_id` da coleta
- Motivo é anexado às observações da coleta para cada resíduo rejeitado
- Útil quando os resíduos não atendem aos critérios de qualidade
- É possível rejeitar múltiplos resíduos de uma só vez com o mesmo motivo

---

### Cancelar Coleta Antes de Chegar ao Local
**POST** `http://localhost:8000/coletas/{coleta_id}/cancelar-antes-local`

Cancela uma coleta PENDENTE e libera os resíduos (RESERVADO → AGENDADO).

**Autenticação:** ✅ Requerida (role: coletor)

**Regras:**
- Coleta deve estar PENDENTE
- Muda estado para CANCELADA
- Libera resíduos: RESERVADO → AGENDADO
- Resíduos ficam disponíveis para outro coletor

**Exemplo:** `http://localhost:8000/coletas/674a1b2c3d4e5f6g7h8i9j0k/cancelar-antes-local`

**Corpo da Requisição:**
```json
{
  "motivo": "Imprevisto no caminho, não consigo chegar a tempo"
}
```

**Campo:**
- `motivo`: Motivo do cancelamento (opcional)

**Resposta de Sucesso (200):**
```json
{
  "id": "674a1b2c3d4e5f6g7h8i9j0k",
  "agendamento_id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtor_id": "60c72b2f9b1d4c3a4c8e4d3a",
  "coletor_id": "60c72b2f9b1d4c3a4c8e4d3b",
  "residuos_id": [
    "60c72b2f9b1d4c3a4c8e4d3f",
    "60c72b2f9b1d4c3a4c8e4d40"
  ],
  "data_hora": "2025-10-22T14:30:00Z",
  "local": {
    "address_id": 1,
    "apelido": "Casa",
    "cep": "64000-000",
    "logradouro": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 101",
    "latitude": "-5.0892",
    "longitude": "-42.8019"
  },
  "observacoes": "Imprevisto no caminho, não consigo chegar a tempo",
  "estado": "CANCELADA"
}
```

**Observações:**
- Resíduos voltam para AGENDADO e ficam disponíveis
- Agendamento volta para PENDENTE
- Outro coletor pode aceitar a coleta

---

### Cancelar Coleta Após Chegar ao Local
**POST** `http://localhost:8000/coletas/{coleta_id}/cancelar`

Cancela uma coleta EM_ANDAMENTO, marca resíduos RESERVADO como CANCELADO e **remove resíduos do inventory do coletor**.

**Autenticação:** ✅ Requerida (role: coletor)

**Regras:**
- Coleta deve estar EM_ANDAMENTO
- Muda estado para CANCELADA
- Resíduos ainda RESERVADO → DESCARTADO
- Resíduos já COLETADOS ou REJEITADOS não são alterados
- **Remove todos os resíduos da coleta do inventory do coletor** (desfaz coletas realizadas)

**Exemplo:** `http://localhost:8000/coletas/674a1b2c3d4e5f6g7h8i9j0k/cancelar`

**Corpo da Requisição:**
```json
{
  "motivo": "Produtor não estava no local"
}
```

**Campo:**
- `motivo`: Motivo do cancelamento (opcional)

**Resposta de Sucesso (200):**
```json
{
  "id": "674a1b2c3d4e5f6g7h8i9j0k",
  "agendamento_id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtor_id": "60c72b2f9b1d4c3a4c8e4d3a",
  "coletor_id": "60c72b2f9b1d4c3a4c8e4d3b",
  "residuos_id": [
    "60c72b2f9b1d4c3a4c8e4d3f",
    "60c72b2f9b1d4c3a4c8e4d40"
  ],
  "data_hora": "2025-10-22T15:00:00Z",
  "local": {
    "address_id": 1,
    "apelido": "Casa",
    "cep": "64000-000",
    "logradouro": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 101",
    "latitude": "-5.0892",
    "longitude": "-42.8019"
  },
  "observacoes": "Produtor não estava no local",
  "estado": "CANCELADA"
}
```

**Observações:**
- Diferença para cancelamento antes: resíduos vão para CANCELADO (não AGENDADO)
- Resíduos já coletados/rejeitados mantêm seus status
- Verifica conclusão do agendamento automaticamente

---

### Listar Minhas Coletas
**GET** `http://localhost:8000/coletas/minhas`

Lista coletas do coletor autenticado, com filtro opcional por estado.

**Autenticação:** ✅ Requerida (role: coletor)

**Parâmetros de Query (opcionais):**
- `estado`: Filtrar por estado (PENDENTE, EM_ANDAMENTO, CANCELADA)
- `limit`: Máximo de registros (padrão: 100, máx: 500)
- `skip`: Paginação - registros a pular (padrão: 0)

**Exemplo:** `http://localhost:8000/coletas/minhas?estado=EM_ANDAMENTO&limit=10`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "674a1b2c3d4e5f6g7h8i9j0k",
    "agendamento_id": "60c72b2f9b1d4c3a4c8e4d3e",
    "produtor_id": "60c72b2f9b1d4c3a4c8e4d3a",
    "coletor_id": "60c72b2f9b1d4c3a4c8e4d3b",
    "residuos_id": [
      "60c72b2f9b1d4c3a4c8e4d3f"
    ],
    "data_hora": "2025-10-22T15:00:00Z",
    "local": {
      "address_id": 1,
      "apelido": "Casa",
      "cep": "64000-000",
      "logradouro": "Rua das Flores",
      "numero": "123",
      "complemento": "Apto 101",
      "latitude": "-5.0892",
      "longitude": "-42.8019"
    },
    "observacoes": null,
    "estado": "EM_ANDAMENTO"
  }
]
```

**Observações:**
- Retorna apenas coletas do coletor autenticado
- Ordenado por `data_hora` (mais recente primeiro)
- Lista vazia `[]` se não houver coletas

---

### Obter Detalhes de uma Coleta
**GET** `http://localhost:8000/coletas/{coleta_id}`

Obtém detalhes completos de uma coleta específica.

**Autenticação:** ✅ Requerida (role: coletor)

**Exemplo:** `http://localhost:8000/coletas/674a1b2c3d4e5f6g7h8i9j0k`

**Resposta de Sucesso (200):**
```json
{
  "id": "674a1b2c3d4e5f6g7h8i9j0k",
  "agendamento_id": "60c72b2f9b1d4c3a4c8e4d3e",
  "produtor_id": "60c72b2f9b1d4c3a4c8e4d3a",
  "coletor_id": "60c72b2f9b1d4c3a4c8e4d3b",
  "residuos_id": [
    "60c72b2f9b1d4c3a4c8e4d3f",
    "60c72b2f9b1d4c3a4c8e4d40"
  ],
  "data_hora": "2025-10-22T15:00:00Z",
  "local": {
    "address_id": 1,
    "apelido": "Casa",
    "cep": "64000-000",
    "logradouro": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 101",
    "latitude": "-5.0892",
    "longitude": "-42.8019"
  },
  "observacoes": "Resíduo coletado em bom estado",
  "estado": "EM_ANDAMENTO"
}
```

**Erros Comuns:**

**403 Forbidden** - Usuário tentando acessar coleta de outro coletor:
```json
{
  "detail": "Você não tem permissão para acessar esta coleta"
}
```

**404 Not Found** - Coleta não encontrada:
```json
{
  "detail": "Coleta não encontrada"
}
```

---

### Obter Inventory do Coletor
**GET** `http://localhost:8000/coletas/inventory/me`

Retorna o inventory detalhado do coletor autenticado com dados completos dos resíduos fisicamente coletados.

**Autenticação:** ✅ Requerida (role: coletor)

**Descrição:**
- Retorna todos os resíduos que o coletor coletou fisicamente (status COLETADO)
- Inclui dados completos: quantidade, categoria, valor estimado, foto, etc.
- Útil para o coletor visualizar seu estoque atual de resíduos
- **Performance otimizada:** 1 única requisição retorna todos os dados (não apenas IDs)

**Exemplo:** `http://localhost:8000/coletas/inventory/me`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "60c72b2f9b1d4c3a4c8e4d3f",
    "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
    "categoriaId": "60c72b2f9b1d4c3a4c8e4d3b",
    "quantidade": 10.0,
    "tipo_medida": "unidade",
    "foto": "http://example.com/garrafas.jpg",
    "valorEstimado": 1.50,
    "status": "COLETADO",
    "dataCadastro": "2025-10-14T10:30:00Z"
  },
  {
    "id": "60c72b2f9b1d4c3a4c8e4d40",
    "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
    "categoriaId": "60c72b2f9b1d4c3a4c8e4d3c",
    "quantidade": 5.0,
    "tipo_medida": "kg",
    "foto": null,
    "valorEstimado": 7.50,
    "status": "COLETADO",
    "dataCadastro": "2025-10-15T14:20:00Z"
  }
]
```

**Resposta quando inventory vazio (200):**
```json
[]
```

**Observações:**
- Frontend recebe dados completos em 1 única requisição (evita N+1 queries)
- Resíduos aparecem no inventory apenas após ação `coletar_residuo`
- Resíduos rejeitados NUNCA aparecem no inventory
- Inventory é atualizado automaticamente quando coleta é cancelada após iniciar

---

## Entregas

O módulo de Entregas permite que coletores registrem a entrega de resíduos coletados para receptoras (ecopontos). 

**Fluxo do Sistema:**
1. Produtor cria resíduos → status: **DISPONIVEL**
2. Coletor aceita agendamento → resíduos vão para: **AGENDADO** → **RESERVADO**
3. Coletor coleta fisicamente → resíduos vão para: **COLETADO** (adicionados ao `inventory`)
4. Coletor entrega na receptora → resíduos vão para: **ENTREGUE** (removidos do `inventory`)

### Criar Entrega
**POST** `http://localhost:8000/entregas`

Registra uma entrega de resíduos do coletor para uma receptora (ecoponto).

**Autenticação:** ✅ Requerida (role: coletor)

**Regras de Autorização:**
- ✅ **Coletor:** Pode criar entregas para seus resíduos coletados
- ❌ **Produtor/Receptor:** Bloqueado

**Fluxo Automático:**
1. Valida que coletor tem os resíduos no `inventory`
2. Valida que resíduos estão com status **COLETADO**
3. Valida que receptora existe e é do tipo correto
4. Cria registro da entrega no banco
5. Atualiza status dos resíduos para **ENTREGUE**
6. Remove resíduos do `inventory` do coletor
7. Registra categorias dos resíduos entregues

**Corpo da Requisição:**
```json
{
  "receptora_id": "60c72b2f9b1d4c3a4c8e4d50",
  "residuos_id": [
    "60c72b2f9b1d4c3a4c8e4d3e",
    "60c72b2f9b1d4c3a4c8e4d3f"
  ],
  "observacoes": "Entrega realizada com sucesso"
}
```

**Campos:**
- `receptora_id`: ID da receptora (ecoponto) que receberá os resíduos (obrigatório)
- `residuos_id`: Array com IDs dos resíduos a entregar (obrigatório, mínimo 1)
- `observacoes`: Observações sobre a entrega (opcional)

**Validações Automáticas:**
- ✅ Lista de resíduos não pode estar vazia
- ✅ Todos os resíduos devem existir
- ✅ Todos os resíduos devem estar no `inventory` do coletor
- ✅ Todos os resíduos devem ter status **COLETADO**
- ✅ Receptora deve existir e ter `role_id: "receptor"`

**Resposta de Sucesso (201):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d60",
  "data_hora": "2025-11-13T15:30:00Z",
  "receptora_id": "60c72b2f9b1d4c3a4c8e4d50",
  "coletor_id": "60c72b2f9b1d4c3a4c8e4d40",
  "residuos_id": [
    "60c72b2f9b1d4c3a4c8e4d3e",
    "60c72b2f9b1d4c3a4c8e4d3f"
  ],
  "categorias_residuos_entregues": [
    "plastico",
    "papel"
  ],
  "observacoes": "Entrega realizada com sucesso"
}
```

**Erros Comuns:**

**403 Forbidden** - Usuário não é coletor:
```json
{
  "detail": "Apenas coletores podem criar entregas"
}
```

**400 Bad Request** - Resíduo não está no inventory:
```json
{
  "detail": "Resíduo '60c72b2f9b1d4c3a4c8e4d3e' não está no inventário do coletor"
}
```

**404 Not Found** - Receptora não encontrada:
```json
{
  "detail": "Receptora '60c72b2f9b1d4c3a4c8e4d50' não encontrada"
}
```

---

### Listar Minhas Entregas
**GET** `http://localhost:8000/entregas`

Lista todas as entregas realizadas pelo coletor autenticado.

**Autenticação:** ✅ Requerida (role: coletor)

**Parâmetros de Query (opcionais):**
- `skip`: Número de registros a pular (padrão: 0)
- `limit`: Número máximo de registros (padrão: 100, máx: 1000)

**Exemplo:** `http://localhost:8000/entregas?skip=0&limit=10`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "60c72b2f9b1d4c3a4c8e4d60",
    "data_hora": "2025-11-13T15:30:00Z",
    "receptora_id": "60c72b2f9b1d4c3a4c8e4d50",
    "coletor_id": "60c72b2f9b1d4c3a4c8e4d40",
    "residuos_id": ["60c72b2f9b1d4c3a4c8e4d3e", "60c72b2f9b1d4c3a4c8e4d3f"],
    "categorias_residuos_entregues": ["plastico", "papel"],
    "observacoes": "Entrega realizada com sucesso"
  }
]
```

**Observações:**
- Retorna apenas entregas do coletor autenticado
- Ordenado por `data_hora` (mais recente primeiro)
- Lista vazia `[]` se não houver entregas

---

### Obter Sumário de Entregas
**GET** `http://localhost:8000/entregas/sumario`

Retorna estatísticas agregadas das entregas agrupadas por categoria e tipo de medida.

**Autenticação:** ✅ Requerida (role: coletor)

**Exemplo:** `http://localhost:8000/entregas/sumario`

**Resposta de Sucesso (200):**
```json
[
  {
    "categoriaId": "plastico",
    "tipo_medida": "kg",
    "quantidade_total": 150.5
  },
  {
    "categoriaId": "papel",
    "tipo_medida": "unidade",
    "quantidade_total": 75.0
  }
]
```

**Casos de Uso:**
- 📊 Dashboard do coletor mostrando total reciclado por categoria
- 🎖️ Sistema de badges baseado em quantidade entregue
- 📈 Relatórios de impacto ambiental
- 🏆 Ranking de coletores

**Observações:**
- Agrupa por `categoriaId` e `tipo_medida`
- Soma todas as quantidades entregues pelo coletor
- Útil para gamificação e estatísticas

---

### Buscar Receptoras Próximas
**POST** `http://localhost:8000/entregas/buscar-receptoras`

Busca receptoras (ecopontos) próximas da localização atual do coletor.

**Autenticação:** ✅ Requerida (role: coletor)

**Descrição:**
Permite que o coletor encontre receptoras disponíveis para entrega de resíduos dentro de um raio específico. Usa a fórmula de Haversine para calcular distâncias geográficas e retorna resultados ordenados por proximidade.

**Algoritmo:**
1. Valida que usuário é coletor
2. Busca todas as receptoras no sistema
3. Calcula distância usando fórmula de Haversine (baseada no primeiro endereço)
4. Filtra por raio especificado
5. Opcionalmente filtra por materiais aceitos
6. Ordena por distância (mais próximas primeiro)

**Corpo da Requisição:**
```json
{
  "latitude": -23.5505,
  "longitude": -46.6333,
  "raio": 5.0,
  "materiais_aceitos": ["plástico", "papel"]
}
```

**Campos:**
- `latitude`: Latitude da localização atual do coletor (obrigatório, entre -90 e 90)
- `longitude`: Longitude da localização atual do coletor (obrigatório, entre -180 e 180)
- `raio`: Raio de busca em quilômetros (obrigatório, máximo 100km)
- `materiais_aceitos`: Lista de materiais para filtrar receptoras (opcional)

**Validações Automáticas:**
- ✅ Latitude deve estar entre -90 e 90 graus
- ✅ Longitude deve estar entre -180 e 180 graus
- ✅ Raio deve ser maior que 0 e no máximo 100km
- ✅ Apenas coletores autenticados podem acessar

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "60c72b2f9b1d4c3a4c8e4d50",
    "name": "Ecoponto Central",
    "email": "ecoponto@example.com",
    "phone": "(11) 98765-4321",
    "accepted_material": ["plástico", "papel", "metal"],
    "addresses": [
      {
        "id": 1,
        "apelido": "Principal",
        "cep": "12345-678",
        "logradouro": "Rua Verde",
        "numero": "100",
        "latitude": "-23.5505",
        "longitude": "-46.6333",
        "complemento": "Galpão 2"
      }
    ],
    "distancia_km": 2.5
  },
  {
    "id": "60c72b2f9b1d4c3a4c8e4d51",
    "name": "Ecoponto Sustentável",
    "email": "sustentavel@example.com",
    "phone": "(11) 91234-5678",
    "accepted_material": ["plástico", "vidro", "papel"],
    "addresses": [
      {
        "id": 1,
        "apelido": "Sede",
        "cep": "12345-679",
        "logradouro": "Avenida Ecológica",
        "numero": "200",
        "latitude": "-23.5520",
        "longitude": "-46.6340",
        "complemento": null
      }
    ],
    "distancia_km": 4.3
  }
]
```

**Resposta quando não há receptoras no raio (200):**
```json
[]
```

**Erros Comuns:**

**403 Forbidden** - Usuário não é coletor:
```json
{
  "detail": "Apenas coletores podem buscar receptoras próximas"
}
```

**422 Unprocessable Entity** - Validação de dados falhou:
```json
{
  "detail": [
    {
      "loc": ["body", "raio"],
      "msg": "ensure this value is less than or equal to 100",
      "type": "value_error.number.not_le"
    }
  ]
}
```

**Casos de Uso:**
- 📍 Coletor visualiza ecopontos próximos para planejar rota de entrega
- 🔍 Filtrar receptoras que aceitam tipos específicos de materiais
- 🗺️ Mapa interativo mostrando receptoras disponíveis
- 📊 Otimização de logística de entrega

**Observações:**
- Distância é calculada usando fórmula de Haversine (great-circle distance)
- Resultados ordenados por distância (mais próxima primeiro)
- Filtro de materiais é opcional - se omitido, retorna todas as receptoras no raio
- Usa o primeiro endereço cadastrado da receptora para calcular distância
- Receptoras sem endereço ou com coordenadas inválidas são ignoradas
- Máximo de 100km de raio para evitar sobrecarga

**Exemplo de Integração com Mapa:**
```javascript
// Frontend React
async function buscarReceptoras() {
  const position = await navigator.geolocation.getCurrentPosition();
  
  const response = await fetch('http://localhost:8000/entregas/buscar-receptoras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      raio: 10.0,
      materiais_aceitos: ['plástico', 'papel']
    })
  });
  
  const receptoras = await response.json();
  // Renderizar marcadores no mapa
  receptoras.forEach(r => addMarker(r.addresses[0].latitude, r.addresses[0].longitude));
}
```

---

## Recompensas

O módulo de Recompensas permite que produtores visualizem prêmios disponíveis para resgate usando seus pontos acumulados no sistema de gamificação. Administradores podem gerenciar o catálogo completo de recompensas.

**Sistema de Pontos:**
- Produtores ganham pontos ao reciclar materiais
- Pontos são usados para resgatar recompensas
- Recompensas têm estoque limitado
- Soft delete mantém histórico de resgates

### Listar Recompensas Ativas
**GET** `http://localhost:8000/recompensas/ativas`

Lista todas as recompensas disponíveis para resgate (ativas).

**Autenticação:** ❌ Não requerida (endpoint público)

**Parâmetros de Query (opcionais):**
- `com_estoque`: Se `true`, retorna apenas recompensas com estoque > 0 (padrão: false)
- `skip`: Quantidade de registros a pular (padrão: 0)
- `limit`: Quantidade máxima de registros (padrão: 100, máx: 100)

**Exemplo:** `http://localhost:8000/recompensas/ativas?com_estoque=true&limit=10`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "60c72b2f9b1d4c3a4c8e4d3e",
    "nome": "Vale-compra R$ 50,00",
    "tipo": "voucher",
    "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
    "pontos_necessarios": 500,
    "foto_url": "https://example.com/vale50.jpg",
    "estoque": 100,
    "parceiro": "Supermercado Verde",
    "data_cadastro": "2025-11-18T10:30:00Z",
    "ativo": true
  },
  {
    "id": "60c72b2f9b1d4c3a4c8e4d3f",
    "nome": "Ecobag Reutilizável",
    "tipo": "produto",
    "descricao": "Ecobag de algodão orgânico",
    "pontos_necessarios": 200,
    "foto_url": null,
    "estoque": 50,
    "parceiro": null,
    "data_cadastro": "2025-11-18T11:00:00Z",
    "ativo": true
  }
]
```

**Casos de Uso:**
- 🎁 Mostrar catálogo de recompensas disponíveis
- 📱 Exibir opções de resgate para produtores
- 💰 Consultar pontos necessários para cada recompensa
- 📊 Filtrar apenas recompensas em estoque

**Observações:**
- Endpoint público - não requer autenticação
- Retorna apenas recompensas com `ativo=true`
- Lista vazia `[]` se não houver recompensas ativas

---

### Obter Detalhes de uma Recompensa
**GET** `http://localhost:8000/recompensas/{recompensa_id}`

Retorna os detalhes completos de uma recompensa específica.

**Autenticação:** ✅ Requerida

**Regras de Autorização:**
- ✅ **Qualquer usuário autenticado** pode acessar
- Produtores usam para ver detalhes antes de resgatar

**Exemplo:** `http://localhost:8000/recompensas/60c72b2f9b1d4c3a4c8e4d3e`

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "nome": "Vale-compra R$ 50,00",
  "tipo": "voucher",
  "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
  "pontos_necessarios": 500,
  "foto_url": "https://example.com/vale50.jpg",
  "estoque": 100,
  "parceiro": "Supermercado Verde",
  "data_cadastro": "2025-11-18T10:30:00Z",
  "ativo": true
}
```

**Erros Comuns:**

**401 Unauthorized** - Usuário não autenticado:
```json
{
  "detail": "Não autenticado"
}
```

**404 Not Found** - Recompensa não encontrada:
```json
{
  "detail": "Recompensa não encontrada"
}
```

---

### [ADMIN] Listar Todas as Recompensas
**GET** `http://localhost:8000/recompensas/`

Lista TODAS as recompensas do sistema (ativas e inativas).

**Autenticação:** ✅ Requerida (role: admin)

**Parâmetros de Query (opcionais):**
- `skip`: Quantidade de registros a pular (padrão: 0)
- `limit`: Quantidade máxima de registros (padrão: 100, máx: 100)

**Exemplo:** `http://localhost:8000/recompensas/?skip=0&limit=20`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "60c72b2f9b1d4c3a4c8e4d3e",
    "nome": "Vale-compra R$ 50,00",
    "tipo": "voucher",
    "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
    "pontos_necessarios": 500,
    "foto_url": "https://example.com/vale50.jpg",
    "estoque": 100,
    "parceiro": "Supermercado Verde",
    "data_cadastro": "2025-11-18T10:30:00Z",
    "ativo": true
  },
  {
    "id": "60c72b2f9b1d4c3a4c8e4d3f",
    "nome": "Desconto 20% - Produto Descontinuado",
    "tipo": "desconto",
    "descricao": "Cupom de desconto que foi descontinuado",
    "pontos_necessarios": 300,
    "foto_url": null,
    "estoque": 0,
    "parceiro": "Loja Antiga",
    "data_cadastro": "2025-10-01T09:00:00Z",
    "ativo": false
  }
]
```

**Erros Comuns:**

**403 Forbidden** - Usuário não é administrador:
```json
{
  "detail": "Acesso negado. Apenas administradores podem realizar esta ação."
}
```

**Observações:**
- Usado no painel administrativo para gerenciar recompensas
- Retorna recompensas ativas E inativas
- Permite visualizar todo o histórico de recompensas

---

### [ADMIN] Criar Nova Recompensa
**POST** `http://localhost:8000/recompensas/`

Cria uma nova recompensa no sistema de gamificação.

**Autenticação:** ✅ Requerida (role: admin)

**Corpo da Requisição:**
```json
{
  "nome": "Vale-compra R$ 50,00",
  "tipo": "voucher",
  "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
  "pontos_necessarios": 500,
  "foto_url": "https://example.com/vale50.jpg",
  "estoque": 100,
  "parceiro": "Supermercado Verde",
  "ativo": true
}
```

**Campos:**
- `nome`: Nome da recompensa (obrigatório, 3-100 caracteres)
- `tipo`: Tipo da recompensa (obrigatório) - valores: `produto`, `desconto`, `voucher`, `cupom`
- `descricao`: Descrição detalhada (obrigatório, mínimo 10 caracteres)
- `pontos_necessarios`: Pontos necessários para resgate (obrigatório, deve ser > 0)
- `foto_url`: URL da foto da recompensa (opcional)
- `estoque`: Quantidade disponível (opcional, padrão: 999, não pode ser negativo)
- `parceiro`: Nome do parceiro que oferece a recompensa (opcional)
- `ativo`: Se a recompensa está ativa (opcional, padrão: true)

**Validações Automáticas:**
- ✅ Nome não pode estar vazio (3-100 caracteres)
- ✅ Tipo deve ser válido: `produto`, `desconto`, `voucher`, `cupom`
- ✅ Descrição deve ter pelo menos 10 caracteres
- ✅ Pontos necessários deve ser maior que zero
- ✅ Estoque não pode ser negativo

**Resposta de Sucesso (201):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "nome": "Vale-compra R$ 50,00",
  "tipo": "voucher",
  "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
  "pontos_necessarios": 500,
  "foto_url": "https://example.com/vale50.jpg",
  "estoque": 100,
  "parceiro": "Supermercado Verde",
  "data_cadastro": "2025-11-18T10:30:00Z",
  "ativo": true
}
```

**Erros Comuns:**

**403 Forbidden** - Usuário não é administrador:
```json
{
  "detail": "Acesso negado. Apenas administradores podem realizar esta ação."
}
```

**422 Unprocessable Entity** - Validação falhou:
```json
{
  "detail": [
    {
      "loc": ["body", "pontos_necessarios"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
```

**Casos de Uso:**
- 🎁 Adicionar nova recompensa para produtores resgatarem
- 🎉 Criar promoções especiais
- 🤝 Cadastrar parcerias com empresas

---

### [ADMIN] Atualizar Recompensa
**PUT** `http://localhost:8000/recompensas/{recompensa_id}`

Atualiza os dados de uma recompensa existente.

**Autenticação:** ✅ Requerida (role: admin)

**Exemplo:** `http://localhost:8000/recompensas/60c72b2f9b1d4c3a4c8e4d3e`

**Corpo da Requisição:**
```json
{
  "nome": "Vale-compra R$ 100,00",
  "pontos_necessarios": 1000,
  "estoque": 50
}
```

**Campos Atualizáveis (todos opcionais):**
- `nome`: Renomear a recompensa (3-100 caracteres)
- `tipo`: Alterar tipo (`produto`, `desconto`, `voucher`, `cupom`)
- `descricao`: Alterar descrição (mínimo 10 caracteres)
- `pontos_necessarios`: Ajustar pontos necessários (> 0)
- `foto_url`: Atualizar foto
- `estoque`: Ajustar estoque (não pode ser negativo)
- `parceiro`: Atualizar parceiro
- `ativo`: Ativar/desativar

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "nome": "Vale-compra R$ 100,00",
  "tipo": "voucher",
  "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
  "pontos_necessarios": 1000,
  "foto_url": "https://example.com/vale50.jpg",
  "estoque": 50,
  "parceiro": "Supermercado Verde",
  "data_cadastro": "2025-11-18T10:30:00Z",
  "ativo": true
}
```

**Erros Comuns:**

**403 Forbidden** - Usuário não é administrador:
```json
{
  "detail": "Acesso negado. Apenas administradores podem realizar esta ação."
}
```

**404 Not Found** - Recompensa não encontrada:
```json
{
  "detail": "Recompensa não encontrada"
}
```

**Observações:**
- ⚠️ Alterar pontos necessários NÃO afeta resgates já realizados
- Apenas campos enviados são atualizados (partial update)

---

### [ADMIN] Atualizar Estoque da Recompensa
**PATCH** `http://localhost:8000/recompensas/{recompensa_id}/estoque`

Atualiza o estoque de uma recompensa (incremento ou decremento).

**Autenticação:** ✅ Requerida (role: admin)

**Parâmetros de Query:**
- `quantidade`: Quantidade a adicionar (positivo) ou remover (negativo) - obrigatório

**Exemplo (adicionar estoque):** `http://localhost:8000/recompensas/60c72b2f9b1d4c3a4c8e4d3e/estoque?quantidade=50`

**Exemplo (remover estoque):** `http://localhost:8000/recompensas/60c72b2f9b1d4c3a4c8e4d3e/estoque?quantidade=-10`

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "nome": "Vale-compra R$ 50,00",
  "tipo": "voucher",
  "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
  "pontos_necessarios": 500,
  "foto_url": "https://example.com/vale50.jpg",
  "estoque": 150,
  "parceiro": "Supermercado Verde",
  "data_cadastro": "2025-11-18T10:30:00Z",
  "ativo": true
}
```

**Erros Comuns:**

**403 Forbidden** - Usuário não é administrador:
```json
{
  "detail": "Acesso negado. Apenas administradores podem realizar esta ação."
}
```

**404 Not Found** - Recompensa não encontrada:
```json
{
  "detail": "Recompensa não encontrada"
}
```

**Casos de Uso:**
- 📦 Adicionar mais unidades ao estoque
- 🔧 Remover unidades (ajuste manual)
- ✅ Corrigir inconsistências de estoque

**Observações:**
- Endpoint auxiliar para facilitar ajuste de estoque sem enviar todos os campos
- Quantidade positiva: incrementa estoque
- Quantidade negativa: decrementa estoque

---

### [ADMIN] Desativar Recompensa
**DELETE** `http://localhost:8000/recompensas/{recompensa_id}`

Desativa uma recompensa (soft delete).

**Autenticação:** ✅ Requerida (role: admin)

**Exemplo:** `http://localhost:8000/recompensas/60c72b2f9b1d4c3a4c8e4d3e`

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "nome": "Vale-compra R$ 50,00",
  "tipo": "voucher",
  "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
  "pontos_necessarios": 500,
  "foto_url": "https://example.com/vale50.jpg",
  "estoque": 100,
  "parceiro": "Supermercado Verde",
  "data_cadastro": "2025-11-18T10:30:00Z",
  "ativo": false
}
```

**Erros Comuns:**

**403 Forbidden** - Usuário não é administrador:
```json
{
  "detail": "Acesso negado. Apenas administradores podem realizar esta ação."
}
```

**404 Not Found** - Recompensa não encontrada:
```json
{
  "detail": "Recompensa não encontrada"
}
```

**Observações - Benefícios do Soft Delete:**
- 🗂️ Resgates antigos mantêm referência à recompensa
- 📊 Histórico permanece consistente
- ♻️ Recompensa pode ser reativada no futuro
- 📈 Estatísticas não são afetadas
- ❌ Recompensas inativas NÃO aparecem na lista pública

**IMPORTANTE:** A recompensa NÃO é deletada do banco, apenas marcada como `ativo=false`.

---

### [ADMIN] Reativar Recompensa
**POST** `http://localhost:8000/recompensas/{recompensa_id}/reativar`

Reativa uma recompensa previamente desativada.

**Autenticação:** ✅ Requerida (role: admin)

**Exemplo:** `http://localhost:8000/recompensas/60c72b2f9b1d4c3a4c8e4d3e/reativar`

**Resposta de Sucesso (200):**
```json
{
  "id": "60c72b2f9b1d4c3a4c8e4d3e",
  "nome": "Vale-compra R$ 50,00",
  "tipo": "voucher",
  "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
  "pontos_necessarios": 500,
  "foto_url": "https://example.com/vale50.jpg",
  "estoque": 100,
  "parceiro": "Supermercado Verde",
  "data_cadastro": "2025-11-18T10:30:00Z",
  "ativo": true
}
```

**Erros Comuns:**

**403 Forbidden** - Usuário não é administrador:
```json
{
  "detail": "Acesso negado. Apenas administradores podem realizar esta ação."
}
```

**404 Not Found** - Recompensa não encontrada:
```json
{
  "detail": "Recompensa não encontrada"
}
```

**Observações:**
- Após reativação, a recompensa volta a aparecer na lista pública (`/recompensas/ativas`)
- Produtores podem resgatar a recompensa novamente

---

## Desenvolvimento

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

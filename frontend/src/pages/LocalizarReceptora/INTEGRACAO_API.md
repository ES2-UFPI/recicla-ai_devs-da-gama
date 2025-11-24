# 🔌 Integração com API - LocalizarReceptora

## ✅ Resumo da Integração

A página **LocalizarReceptora** foi integrada com a API real, substituindo os dados mock por chamadas HTTP ao backend através do endpoint `/entregas/buscar-receptoras`.

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

#### 1. `/src/types/entrega.ts`
- **Descrição:** Tipos TypeScript para entrega e receptoras
- **Conteúdo:**
  - `Receptora` - Interface completa de uma receptora
  - `HorarioFuncionamento` - Horários de funcionamento
  - `EnderecoReceptora` - Endereço completo
  - `BuscarReceptorasRequest` - Parâmetros de busca
  - `ReceptoraComDistancia` - Receptora com distância calculada
  - `EntregaCreate`, `EntregaResponse`, `EntregaSumario` - Tipos para entregas

#### 2. `/src/services/entrega.service.ts`
- **Descrição:** Serviço para consumir endpoints de entrega
- **Métodos:**
  - `buscarReceptorasProximas()` - Busca receptoras próximas do coletor
  - `criarEntrega()` - Cria uma nova entrega
  - `listarEntregas()` - Lista entregas do coletor
  - `obterSumarioEntregas()` - Estatísticas de entregas

### Arquivos Modificados

#### 1. `/src/pages/LocalizarReceptora/hooks/useReceptoras.ts`
**Mudanças:**
- ❌ Removido: Dados mock (`MOCK_RECEPTORAS`)
- ❌ Removido: Função `calcularDistancia()` (agora calculado no backend)
- ✅ Adicionado: Importação de `entregaService`
- ✅ Adicionado: Importação de tipos de `../../../types/entrega`
- ✅ Atualizado: `buscarReceptorasProximas()` agora chama API real
- ✅ Atualizado: `buscarReceptoraPorId()` usa dados da API

**Antes:**
```typescript
// Mock data hardcoded
const MOCK_RECEPTORAS: Receptora[] = [...];

// Simulava delay e filtrava localmente
await new Promise(resolve => setTimeout(resolve, 800));
let resultado = [...MOCK_RECEPTORAS].filter(...);
```

**Depois:**
```typescript
// Chama API real
const resultado = await entregaService.buscarReceptorasProximas({
  latitude: params.latitude,
  longitude: params.longitude,
  raio: params.raio,
  materiais_aceitos: params.categorias_ids,
});
```

#### 2. `/src/pages/LocalizarReceptora/components/ReceptorasList.tsx`
**Mudanças:**
- ✅ Atualizado: Importação de tipos de `../../../types/entrega` em vez de `../hooks/useReceptoras`

#### 3. `/src/pages/LocalizarReceptora/components/InteractiveMap.tsx`
**Mudanças:**
- ✅ Atualizado: Importação de tipos de `../../../types/entrega` em vez de `../hooks/useReceptoras`

---

## 🔗 Endpoint Utilizado

### POST `/entregas/buscar-receptoras`

**Request Body:**
```json
{
  "latitude": -5.0892,
  "longitude": -42.8019,
  "raio": 5.0,
  "materiais_aceitos": ["691539406ac616e0bcb1141d", "691539406ac616e0bcb1141f"]
}
```

**Response (baseado no schema ReceptoraComDistancia do backend):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ecoponto Central",
    "email": "ecoponto@example.com",
    "phone": "(11) 98765-4321",
    "accepted_material": ["691539406ac616e0bcb1141d", "691539406ac616e0bcb1141f"],
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
  }
]
```

**Validações:**
- ✅ Apenas coletores autenticados podem acessar
- ✅ Backend calcula distância usando Haversine
- ✅ Backend filtra por raio e materiais aceitos
- ✅ Backend retorna ordenado por distância (mais próxima primeiro)

---

## 🎯 Funcionalidades Implementadas

### ✅ Busca de Receptoras Próximas
- Localização do usuário via Geolocation API
- Busca automática ao carregar a página
- Filtro por raio (km)
- Filtro por categorias de material aceito
- Cálculo de distância no backend
- Ordenação por proximidade

### ✅ Tratamento de Erros
- Erro de geolocalização (fallback para Teresina)
- Erro de rede/API
- Mensagens amigáveis ao usuário
- Estado de loading durante requisições

### ✅ Interface Responsiva
- Mapa interativo com marcadores
- Lista de receptoras com cards
- Botão "Realizar Entrega" em cada receptora
- Indicador de status (Aberto/Fechado)
- Chips de materiais aceitos
- Links para Google Maps

---

## 🔄 Fluxo de Dados

```
┌──────────────────┐
│  User Location   │ (Geolocation API)
└────────┬─────────┘
         │
         v
┌──────────────────┐
│  useReceptoras   │ (Hook React)
└────────┬─────────┘
         │
         v
┌──────────────────┐
│ entregaService   │ (HTTP Client)
└────────┬─────────┘
         │
         v
┌──────────────────┐
│  Backend API     │ (FastAPI)
│ /entregas/       │
│ buscar-receptoras│
└────────┬─────────┘
         │
         v
┌──────────────────┐
│   MongoDB        │ (Banco de Dados)
│ collection:      │
│   - users        │
│   - receptoras   │
└──────────────────┘
```

---

## 🧪 Como Testar

### 1. Requisitos
- Backend rodando em `http://localhost:8000`
- Usuário autenticado como **coletor**
- Receptoras cadastradas no banco de dados

### 2. Passos

1. **Login como coletor:**
   ```
   POST /auth/login
   {
     "credential": "coletor@example.com",
     "password": "senha123"
   }
   ```

2. **Acessar a página:**
   ```
   http://localhost:5173/localizar-receptora
   ```

3. **Permitir geolocalização no navegador**

4. **Verificar:**
   - ✅ Mapa centralizado na sua localização
   - ✅ Marcador azul (sua localização)
   - ✅ Marcadores verdes (receptoras próximas)
   - ✅ Lista de receptoras ordenada por distância
   - ✅ Filtros funcionando

5. **Testar filtros:**
   - Ajustar raio de busca
   - Selecionar categorias de material
   - Clicar em "Buscar"

6. **Testar interações:**
   - Clicar nos marcadores do mapa
   - Clicar nos cards da lista
   - Clicar em "Realizar Entrega"
   - Abrir rotas no Google Maps

---

## 🐛 Tratamento de Erros

### Erro de Autenticação (401)
```typescript
// Interceptor em api.ts tenta refresh automático
// Se falhar, usuário é redirecionado para /login
```

### Erro de Permissão (403)
```json
{
  "detail": "Apenas coletores podem buscar receptoras"
}
```
- **Solução:** Verificar se usuário está logado como coletor

### Erro de Geolocalização
```
"Não foi possível obter sua localização"
```
- **Fallback:** Usa Teresina-PI como localização padrão
- **Solução:** Permitir geolocalização no navegador

### Nenhuma Receptora Encontrada
```
"Nenhuma receptora encontrada no raio especificado"
```
- **Solução:** Aumentar o raio de busca ou ajustar filtros

---

## 📝 Próximos Passos

### Melhorias Sugeridas

1. **Cache de Resultados**
   - Implementar cache local para evitar requisições repetidas
   - Usar React Query ou SWR

2. **Endpoint Específico para Receptora por ID**
   - Criar `GET /entregas/receptoras/{id}`
   - Evitar buscar todas para encontrar uma

3. **Paginação**
   - Implementar scroll infinito na lista
   - Carregar mais receptoras sob demanda

4. **Favoritos**
   - Permitir marcar receptoras como favoritas
   - Persistir no perfil do coletor

5. **Feedback Visual**
   - Animações ao carregar
   - Skeleton screens
   - Toast notifications

6. **Offline Support**
   - Service Worker
   - Cache de última busca
   - PWA features

---

## 📝 Observações Importantes

- ⚠️ Apenas usuários com `role_id: "coletor"` podem acessar este endpoint
- ⚠️ Backend deve ter receptoras (usuários com role "receptor") cadastradas no banco
- ⚠️ O campo `accepted_material` das receptoras corresponde aos IDs das categorias
- ⚠️ **Campos disponíveis:** O backend retorna apenas: `id`, `name`, `email`, `phone`, `accepted_material`, `addresses`, `distancia_km`
- ⚠️ **Campos NÃO disponíveis:** Horário de funcionamento, descrição, observações (removidos da UI)
- ✅ Sem erros de compilação ou lint
- ✅ Documentação completa criada

---

## 🎓 Referências

- [Documentação da API - entrega_router.py](../../../backend/src/routers/entrega_router.py)
- [Documentação Completa - API_ROTAS.md](../../../backend/API_ROTAS.md)
- [Types de Entrega](../../types/entrega.ts)
- [Serviço de Entrega](../../services/entrega.service.ts)

---

## 👥 Autores

- **Integração API:** GitHub Copilot
- **Data:** 14 de novembro de 2025
- **Projeto:** ReciclaAI - Sistema de Gestão de Resíduos

---

✅ **Status:** Integração completa e funcional

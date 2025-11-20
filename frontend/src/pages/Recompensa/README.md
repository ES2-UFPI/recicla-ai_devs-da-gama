# Página de Recompensas - Estrutura e Documentação

## 📁 Estrutura de Arquivos

```
Recompensa/
├── index.tsx                    # Componente principal (orquestrador)
├── types.ts                     # Definições de tipos TypeScript
├── constants.ts                 # Constantes (ícones, labels, configs)
├── components/                  # Componentes de UI reutilizáveis
│   ├── index.ts                # Barrel export
│   ├── RecompensaHeader.tsx    # Cabeçalho com título, saldo e botão
│   ├── RecompensaFilters.tsx   # Filtros de tipo e ordenação
│   ├── RecompensaCard.tsx      # Card individual de recompensa
│   ├── RecompensaGrid.tsx      # Grid com paginação
│   ├── RecompensaDetailModal.tsx # Modal de detalhes/resgate
│   └── SuccessModal.tsx        # Modal de sucesso após resgate
└── hooks/                       # Custom hooks para lógica de negócio
    ├── index.ts                # Barrel export
    ├── useRecompensas.ts       # Busca e gerencia lista de recompensas
    ├── useImageFallback.ts     # Controle de imagens com erro
    └── useRecompensaFilters.ts # Filtros e ordenação
```

## 🎯 Princípios Aplicados

### 1. **Separação de Responsabilidades**
- **index.tsx**: Orquestra componentes e hooks, gerencia estado global da página
- **components/**: Componentes visuais puros, focados em apresentação
- **hooks/**: Lógica de negócio reutilizável (fetching, filtros, estados)
- **types.ts**: Centraliza definições de tipos
- **constants.ts**: Valores fixos (evita magic strings/numbers)

### 2. **Composição sobre Herança**
Cada componente é pequeno e focado em uma única responsabilidade:
- `RecompensaCard` → Exibe uma recompensa
- `RecompensaGrid` → Organiza cards + paginação
- `RecompensaFilters` → Controles de filtro/ordenação

### 3. **Custom Hooks para Reutilização**
- `useRecompensas()`: Lógica de fetch pode ser reutilizada em outras páginas
- `useImageFallback()`: Sistema de fallback pode ser usado em outros lugares
- `useRecompensaFilters()`: Filtros podem ser aplicados a outras listas

### 4. **Props Drilling Minimizado**
Hooks encapsulam lógica complexa, componentes recebem apenas dados necessários via props.

## 📦 Componentes

### RecompensaHeader
**Responsabilidade**: Exibir título, saldo de pontos e botão de histórico

**Props**:
```typescript
{
  userPoints: number;
}
```

### RecompensaFilters
**Responsabilidade**: Filtros de tipo e ordenação

**Props**:
```typescript
{
  tipoFiltro: TipoRecompensa;
  onTipoChange: (tipo: TipoRecompensa) => void;
  ordenacao: OrdenacaoPontos;
  onOrdenacaoChange: (ordenacao: OrdenacaoPontos) => void;
  totalResultados: number;
}
```

### RecompensaCard
**Responsabilidade**: Exibir uma recompensa individual

**Props**:
```typescript
{
  recompensa: Recompensa;
  imageUrl: string;
  onImageError: (id: string) => void;
  podResgatar: boolean;
  onVerDetalhes: () => void;
}
```

### RecompensaGrid
**Responsabilidade**: Grid de cards + loading + empty state + paginação

**Props**:
```typescript
{
  recompensas: Recompensa[];
  loading: boolean;
  userPoints: number;
  getImageUrl: (recompensa: Recompensa) => string;
  onImageError: (id: string) => void;
  onVerDetalhes: (recompensa: Recompensa) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (_: unknown, page: number) => void;
}
```

### RecompensaDetailModal
**Responsabilidade**: Modal de detalhes com ação de resgate

**Props**:
```typescript
{
  recompensa: Recompensa | null;
  open: boolean;
  onClose: () => void;
  onResgatar: () => void;
  onNavigateToResiduos: () => void;
  resgatando: boolean;
  userPoints: number;
  getImageUrl: (recompensa: Recompensa) => string;
  onImageError: (id: string) => void;
}
```

### SuccessModal
**Responsabilidade**: Feedback visual após resgate bem-sucedido

**Props**:
```typescript
{
  open: boolean;
  onClose: () => void;
  resgateInfo: ResgateInfo | null;
  userPoints: number;
}
```

## 🪝 Custom Hooks

### useRecompensas()
**Retorna**:
```typescript
{
  recompensas: Recompensa[];
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  refetch: () => Promise<void>;
}
```

**Uso**: Busca lista de recompensas ativas com estoque

### useImageFallback()
**Retorna**:
```typescript
{
  handleImageError: (id: string) => void;
  getImageUrl: (recompensa: Recompensa) => string;
}
```

**Uso**: Sistema inteligente de fallback para imagens quebradas

### useRecompensaFilters()
**Parâmetros**:
```typescript
(
  recompensas: Recompensa[],
  onResetPage: () => void
)
```

**Retorna**:
```typescript
{
  recompensasFiltradas: Recompensa[];
  tipoFiltro: TipoRecompensa;
  setTipoFiltro: (tipo: TipoRecompensa) => void;
  ordenacao: OrdenacaoPontos;
  setOrdenacao: (ordenacao: OrdenacaoPontos) => void;
  resetPage: () => void;
}
```

**Uso**: Aplica filtros e ordenação, reseta página automaticamente

## 🔄 Fluxo de Dados

```
index.tsx (Estado Global)
    ↓
useRecompensas() → Busca dados da API
    ↓
useRecompensaFilters() → Aplica filtros/ordenação
    ↓
RecompensaGrid → Renderiza lista paginada
    ↓
RecompensaCard → Exibe cada item
    ↓
onClick → Abre RecompensaDetailModal
    ↓
handleResgatar() → Chama API + refreshUser()
    ↓
SuccessModal → Mostra feedback
```

## 🎨 Padrões de Design

### Container/Presentational Pattern
- **Container**: `index.tsx` (lógica)
- **Presentational**: Todos em `components/` (UI pura)

### Custom Hooks Pattern
Encapsulam lógica reutilizável e efeitos colaterais

### Compound Components Pattern
Grid + Card + Pagination trabalham juntos mas são independentes

## 🧪 Testabilidade

Cada parte pode ser testada isoladamente:

```typescript
// Testar hook de filtros
const { result } = renderHook(() => useRecompensaFilters(mockData, jest.fn()));

// Testar componente de card
render(<RecompensaCard recompensa={mockRecompensa} {...props} />);

// Testar modal
render(<SuccessModal open={true} resgateInfo={mockInfo} />);
```

## 🚀 Benefícios

1. **Manutenibilidade**: Cada arquivo tem < 200 linhas
2. **Reutilização**: Hooks e componentes podem ser usados em outras páginas
3. **Testabilidade**: Unidades pequenas, fáceis de testar
4. **Legibilidade**: Código autodocumentado por separação clara
5. **Performance**: Memoização facilitada em componentes pequenos
6. **Escalabilidade**: Adicionar funcionalidades não afeta código existente

## 📝 Convenções

- **Nomes**: PascalCase para componentes, camelCase para hooks
- **Arquivos**: Um componente/hook por arquivo
- **Exports**: Barrel exports (`index.ts`) para imports limpos
- **Props**: Interfaces TypeScript explícitas
- **Comentários**: Apenas onde necessário (código autoexplicativo)

## 🔧 Como Adicionar Funcionalidades

### Adicionar novo filtro:
1. Atualizar tipos em `types.ts`
2. Modificar lógica em `useRecompensaFilters.ts`
3. Adicionar campo em `RecompensaFilters.tsx`

### Adicionar novo tipo de modal:
1. Criar novo componente em `components/`
2. Adicionar ao barrel export
3. Importar e usar em `index.tsx`

### Adicionar nova lógica de negócio:
1. Criar novo hook em `hooks/`
2. Adicionar ao barrel export
3. Usar no componente principal

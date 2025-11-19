# Tela de Realizar Entrega

## 📋 Visão Geral

A tela de **Realizar Entrega** permite que coletores entreguem resíduos do seu inventário para receptoras (ecopontos). A interface foi projetada seguindo princípios de **UX/UI** e **Engenharia de Software** para proporcionar uma experiência intuitiva e eficiente.

## ✨ Funcionalidades Principais

### 1. **Seleção por Categoria** (Requisito Principal)
- O coletor seleciona **categorias inteiras**, não resíduos individuais
- Ao selecionar uma categoria, **todos os resíduos** daquela categoria no inventory são incluídos
- Apenas categorias que a receptora aceita são exibidas

### 2. **Agrupamento e Totalizações**
- Resíduos são **agrupados por categoria**
- Exibição de totais por categoria:
  - Quantidade de resíduos
  - Total em kg (quando aplicável)
  - Total em unidades (quando aplicável)

### 3. **Informações da Receptora**
- Card destacado com informações da receptora:
  - Nome e contato
  - Endereço completo
  - Materiais aceitos
  - Distância (se disponível)

### 4. **Feedback Visual**
- Cards de categoria com estados visual distintos (selecionado/não selecionado)
- Resumo da seleção em tempo real
- Animações e transições suaves
- Loading states apropriados

## 🏗️ Arquitetura

### Separação de Responsabilidades

```
RealizarEntrega/
├── index.tsx                 # Componente principal (Presentational)
├── types.ts                  # Tipos TypeScript
├── hooks/
│   └── useRealizarEntrega.ts # Lógica de negócio (Business Logic)
└── components/
    ├── ReceptoraCard.tsx     # Card de informações da receptora
    ├── CategoriaCard.tsx     # Card de categoria selecionável
    ├── TotalSelecionadoCard.tsx # Resumo da seleção
    └── index.ts              # Barrel export
```

### Princípios Aplicados

#### 1. **Single Responsibility Principle (SRP)**
- Cada componente tem uma única responsabilidade
- Hook customizado gerencia toda a lógica de negócio
- Componentes são puramente presentacionais

#### 2. **Separation of Concerns**
- **Lógica de negócio**: Isolada no hook `useRealizarEntrega`
- **Apresentação**: Componentes focados apenas em renderização
- **Tipos**: Definidos em arquivo separado

#### 3. **DRY (Don't Repeat Yourself)**
- Componentes reutilizáveis (CategoriaCard, TotalSelecionadoCard)
- Lógica centralizada no hook
- Tipos compartilhados

#### 4. **Composition over Inheritance**
- Componentes compostos de componentes menores
- Props para customização
- Sem herança de classe

## 🎨 Princípios de UX/UI

### 1. **Clareza e Simplicidade**
- Interface limpa e sem distrações
- Hierarquia visual clara
- Textos descritivos e informativos

### 2. **Feedback Imediato**
- Estados visuais claros (selecionado/não selecionado)
- Resumo em tempo real da seleção
- Loading states durante operações

### 3. **Prevenção de Erros**
- Botão desabilitado quando nenhuma categoria está selecionada
- Validações no hook antes do submit
- Mensagens de erro claras

### 4. **Consistência**
- Cores consistentes (sucesso = verde, erro = vermelho)
- Padrão de cards similar em toda a aplicação
- Ícones intuitivos

### 5. **Responsividade**
- Layout adaptável para mobile e desktop
- Tipografia ajustada por breakpoint
- Espaçamentos proporcionais

### 6. **Hierarquia de Informação**
1. **Primário**: Informações da receptora (card destacado)
2. **Secundário**: Seleção de categorias (área principal)
3. **Terciário**: Observações e totais

## 📊 Fluxo de Dados

```
1. Usuário acessa tela com receptoraId
   ↓
2. Hook busca dados (receptora + inventory)
   ↓
3. Filtra resíduos que a receptora aceita
   ↓
4. Agrupa resíduos por categoria
   ↓
5. Usuário seleciona categorias
   ↓
6. Hook calcula totais em tempo real
   ↓
7. Usuário confirma entrega
   ↓
8. Hook coleta IDs de todos os resíduos das categorias selecionadas
   ↓
9. Envia para API
   ↓
10. Exibe tela de sucesso
```

## 🔧 Tecnologias e Bibliotecas

- **React**: Componentização e hooks
- **TypeScript**: Tipagem forte
- **Material-UI**: Componentes e design system
- **React Router**: Navegação
- **Axios**: Requisições HTTP

## 📱 Responsividade

- **Mobile (< 600px)**: Layout em coluna, tipografia ajustada
- **Tablet (600-960px)**: Layout híbrido
- **Desktop (> 960px)**: Layout completo com sidebar

## ♿ Acessibilidade

- Semântica HTML apropriada
- Labels descritivos
- Contraste de cores adequado
- Navegação por teclado
- ARIA labels quando necessário

## 🧪 Estados da Aplicação

### Estados de Loading
- **Inicial**: Carregando dados da receptora e inventory
- **Submitting**: Processando entrega

### Estados de Sucesso
- Tela de confirmação após entrega bem-sucedida
- Redirecionamento automático após 2.5s

### Estados de Erro
- Erro ao carregar dados
- Erro ao submeter entrega
- Validações (nenhuma categoria selecionada)

## 🔐 Validações

### Frontend
- Pelo menos uma categoria deve estar selecionada
- Observações são opcionais

### Backend (via API)
- Coletor autenticado
- Resíduos pertencem ao inventory do coletor
- Resíduos têm status COLETADO
- Receptora existe e aceita os materiais

## 🚀 Melhorias Futuras

1. **Cache de dados**: Usar React Query ou SWR
2. **Otimistic Updates**: Atualizar UI antes da resposta da API
3. **Modo offline**: Salvar rascunhos localmente
4. **Analytics**: Tracking de eventos de entrega
5. **Histórico**: Visualizar entregas anteriores nesta receptora
6. **Sugestões**: ML para sugerir categorias baseado em histórico

## 📝 Como Usar

```tsx
// Na sua aplicação
import RealizarEntrega from './pages/RealizarEntrega';

// No Router
<Route path="/entregar/:id" element={<RealizarEntrega />} />
```

## 🤝 Contribuindo

Ao modificar esta tela, mantenha:
- Separação de lógica e apresentação
- Componentes pequenos e focados
- Tipos bem definidos
- Feedback visual claro ao usuário
- Testes unitários para o hook

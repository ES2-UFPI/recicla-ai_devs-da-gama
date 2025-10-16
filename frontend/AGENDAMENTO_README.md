# Instalação de Dependências para Agendamento

## ✅ Dependências Instaladas

As seguintes dependências já foram instaladas:

```bash
npm install leaflet react-leaflet @types/leaflet
```

## Componentes Criados

### 1. **EnderecoSelector** (`/src/components/EnderecoSelector.tsx`)
- Permite selecionar endereço de 3 formas:
  - **Endereço salvo**: Lista de endereços do usuário
  - **Digitar manualmente**: Formulário completo com busca de CEP via ViaCEP
  - **Mapa interativo**: Seleção visual no mapa com Leaflet ✅

### 2. **DisponibilidadeSelector** (`/src/components/DisponibilidadeSelector.tsx`)
- Gerencia horários de disponibilidade para coleta
- Cada horário tem: data, horário início, horário fim
- Permite adicionar/remover múltiplos horários
- Converte automaticamente para o formato do backend: `[inicio1, fim1, inicio2, fim2, ...]`
- Textos otimizados para UX/UI

### 3. **ResiduoSelector** (`/src/components/ResiduoSelector.tsx`)
- Lista de resíduos disponíveis do usuário
- Seleção múltipla com checkboxes
- Opção "Selecionar todos"
- Visual interativo com destaque para itens selecionados
- Textos otimizados para UX/UI

### 4. **MapSelector** (`/src/components/MapSelector.tsx`) ✨ NOVO
- Mapa interativo com Leaflet
- Permite clicar no mapa para selecionar localização
- Botão "Usar Minha Localização" com geolocalização HTML5
- Reverse geocoding automático (converte coordenadas em endereço)
- Exibe coordenadas selecionadas
- Integrado com OpenStreetMap

## Interface de Endereco

Criada em `/src/types/endereco.ts`, compatível com o modelo do backend:

```typescript
interface Endereco {
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  latitude: string;
  longitude: string;
  complemento?: string;
}
```

## Funcionalidades Implementadas

✅ **Seleção de múltiplos resíduos**  
✅ **Seleção de endereço (salvo ou novo)**  
✅ **Busca automática de CEP** (ViaCEP API)  
✅ **Múltiplas faixas de disponibilidade**  
✅ **Validação de campos obrigatórios**  
✅ **Dialog responsivo** (fullscreen em mobile)  
✅ **Mock data para testes**  
✅ **Seleção de endereço via mapa** (Leaflet + OpenStreetMap)  
✅ **Geolocalização do usuário**  
✅ **Reverse geocoding** (coordenadas → endereço)  
✅ **Textos otimizados para UX/UI**

## Melhorias de UX/UI Implementadas

### Textos Atualizados:
- ✅ "Faixas de Disponibilidade" → "Horários de Disponibilidade para Coleta"
- ✅ "Faixa 1, 2, 3..." → "Horário 1, 2, 3..."
- ✅ "Adicionar Faixa de Horário" → "Adicionar Outro Horário"
- ✅ "Selecionar Endereço de Coleta" → "Endereço para Coleta"
- ✅ "Digitar novo endereço" → "Digitar endereço manualmente"
- ✅ "Selecionar no mapa" → "Selecionar localização no mapa"
- ✅ "Selecionar Resíduos para Coleta" → "Resíduos para Coleta"

### Descrições Adicionadas:
- ✅ Texto explicativo em cada seção do formulário
- ✅ Feedback visual de coordenadas selecionadas no mapa
- ✅ Indicador de endereço confirmado

## Recursos do Mapa

- 📍 **Clique para selecionar**: Clique em qualquer ponto do mapa
- 🎯 **Minha localização**: Botão para usar GPS do dispositivo
- 🗺️ **OpenStreetMap**: Mapas de alta qualidade
- 🏠 **Reverse geocoding**: Converte coordenadas em endereço automaticamente
- ✅ **Confirmação visual**: Mostra as coordenadas selecionadas

## Próximos Passos

1. ✅ ~~Instalar Leaflet~~ (Completo)
2. ✅ ~~Implementar MapSelector~~ (Completo)
3. ✅ ~~Melhorar textos UX/UI~~ (Completo)
4. **Conectar com API real** quando endpoints estiverem disponíveis
5. **Adicionar validações adicionais** (ex: horário fim > horário início)
6. **Integrar com contexto de autenticação** para pegar dados reais do usuário

## Estrutura do Dialog

O dialog agora está dividido em seções com textos claros:
1. **Resíduos para Coleta** - Selecione os resíduos
2. **Endereço para Coleta** - Informe onde será a coleta
3. **Horários de Disponibilidade para Coleta** - Informe quando você está disponível
4. **Observações** - Informações adicionais (opcional)

Cada seção é separada por dividers e inclui descrições explicativas.

## Dados Mock

O arquivo inclui mock data para:
- `mockResiduosDisponiveis`: Lista de resíduos do usuário
- `mockEnderecosSalvos`: Endereços salvos do usuário
- `mockAgendamentos`: Agendamentos existentes para visualização

## Notas Técnicas

### Leaflet
- CSS importado automaticamente no componente MapSelector
- Ícones padrão configurados corretamente
- Compatível com touch devices (mobile)

### APIs Utilizadas
- **ViaCEP**: Busca de CEP brasileiro
- **Nominatim (OpenStreetMap)**: Reverse geocoding
- **Geolocation API**: Localização do usuário

### Validações
- O botão "Criar Agendamento" fica desabilitado até que:
  - ✅ Pelo menos 1 resíduo seja selecionado
  - ✅ Um endereço seja selecionado
  - ✅ Pelo menos 1 horário válido seja preenchido


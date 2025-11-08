# 📚 Exemplos de Testes - ReciclaAI

Este documento contém exemplos práticos de testes para serem usados como referência durante a implementação do TDD na Sprint 2.

---

## 🐍 Backend - Pytest (Python/FastAPI)

### 1. Teste de Service (Lógica de Negócio)

```python
# backend/tests/test_user_service.py
import pytest
from unittest.mock import AsyncMock, patch
from src.service.user_service import UserService
from src.schemas.user_schemas import UserCreateDTO

@pytest.mark.asyncio
async def test_criar_usuario_com_sucesso():
    """Teste: criar usuário com dados válidos deve retornar o usuário criado"""
    # Arrange
    user_data = UserCreateDTO(
        nome="João Silva",
        email="joao@example.com",
        senha="senha123",
        papel="produtor",
        telefone="86999999999"
    )
    
    # Mock do repositório
    with patch('src.service.user_service.UserRepository') as mock_repo:
        mock_repo.find_by_email.return_value = None  # Email não existe
        mock_repo.create.return_value = {
            "id": "123",
            "nome": "João Silva",
            "email": "joao@example.com",
            "papel": "produtor"
        }
        
        # Act
        resultado = await UserService.criar_usuario(user_data)
        
        # Assert
        assert resultado is not None
        assert resultado["email"] == "joao@example.com"
        assert resultado["papel"] == "produtor"
        mock_repo.create.assert_called_once()


@pytest.mark.asyncio
async def test_criar_usuario_email_duplicado():
    """Teste: criar usuário com email já existente deve lançar exceção"""
    # Arrange
    user_data = UserCreateDTO(
        nome="João Silva",
        email="existe@example.com",
        senha="senha123",
        papel="produtor"
    )
    
    # Mock do repositório retornando que email já existe
    with patch('src.service.user_service.UserRepository') as mock_repo:
        mock_repo.find_by_email.return_value = {"email": "existe@example.com"}
        
        # Act & Assert
        with pytest.raises(ValueError, match="Email já cadastrado"):
            await UserService.criar_usuario(user_data)


@pytest.mark.asyncio
async def test_validar_senha_minima():
    """Teste: senha muito curta deve falhar na validação"""
    # Arrange
    user_data = UserCreateDTO(
        nome="João Silva",
        email="joao@example.com",
        senha="123",  # Senha muito curta
        papel="produtor"
    )
    
    # Act & Assert
    with pytest.raises(ValueError, match="Senha deve ter no mínimo"):
        await UserService.criar_usuario(user_data)
```

---

### 2. Teste de Endpoint (API)

```python
# backend/tests/test_endpoints.py
import pytest
from httpx import AsyncClient
from server import app

@pytest.mark.asyncio
async def test_registrar_usuario_sucesso():
    """Teste: POST /users/register com dados válidos deve retornar 201"""
    # Arrange
    async with AsyncClient(app=app, base_url="http://test") as client:
        payload = {
            "nome": "Maria Santos",
            "email": "maria@example.com",
            "senha": "senha123456",
            "papel": "coletor",
            "telefone": "86988888888"
        }
        
        # Act
        response = await client.post("/users/register", json=payload)
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "maria@example.com"
        assert data["papel"] == "coletor"
        assert "senha" not in data  # Não deve retornar senha


@pytest.mark.asyncio
async def test_registrar_usuario_email_invalido():
    """Teste: POST /users/register com email inválido deve retornar 422"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        payload = {
            "nome": "Teste",
            "email": "email-invalido",  # Email sem @
            "senha": "senha123",
            "papel": "produtor"
        }
        
        # Act
        response = await client.post("/users/register", json=payload)
        
        # Assert
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_sucesso():
    """Teste: POST /auth/login com credenciais válidas deve retornar token"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Primeiro, criar um usuário
        await client.post("/users/register", json={
            "nome": "Teste Login",
            "email": "login@example.com",
            "senha": "senha123",
            "papel": "produtor"
        })
        
        # Act - Fazer login
        response = await client.post("/auth/login", json={
            "email": "login@example.com",
            "senha": "senha123"
        })
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
```

---

### 3. Teste com Fixtures (Reutilização)

```python
# backend/tests/conftest.py
import pytest
from motor.motor_asyncio import AsyncIOMotorClient
from src.infra.database import get_database

@pytest.fixture
async def db_client():
    """Fixture: cliente do banco de dados para testes"""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["reciclaai_test"]
    yield db
    # Cleanup após o teste
    await client.drop_database("reciclaai_test")
    client.close()


@pytest.fixture
async def usuario_produtor(db_client):
    """Fixture: cria um usuário produtor para testes"""
    from src.service.user_service import UserService
    from src.schemas.user_schemas import UserCreateDTO
    
    user_data = UserCreateDTO(
        nome="Produtor Teste",
        email="produtor@test.com",
        senha="senha123",
        papel="produtor"
    )
    
    user = await UserService.criar_usuario(user_data)
    return user


# Uso da fixture
@pytest.mark.asyncio
async def test_criar_residuo_com_produtor_valido(usuario_produtor):
    """Teste: produtor pode criar resíduo"""
    # Arrange
    residuo_data = {
        "produtor_id": usuario_produtor["id"],
        "categoria": "plastico",
        "quantidade": 5.0,
        "unidade_medida": "kg"
    }
    
    # Act
    resultado = await ResidueService.criar_residuo(residuo_data)
    
    # Assert
    assert resultado["produtor_id"] == usuario_produtor["id"]
```

---

## ⚛️ Frontend - Vitest (React/TypeScript)

### 1. Teste de Componente

```typescript
// frontend/src/components/__tests__/UserForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserForm } from '../UserForm';

describe('UserForm', () => {
  it('deve renderizar todos os campos do formulário', () => {
    // Arrange & Act
    render(<UserForm />);
    
    // Assert
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/papel/i)).toBeInTheDocument();
  });

  it('deve validar email inválido', async () => {
    // Arrange
    render(<UserForm />);
    const emailInput = screen.getByLabelText(/email/i);
    
    // Act
    fireEvent.change(emailInput, { target: { value: 'email-invalido' } });
    fireEvent.blur(emailInput);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it('deve submeter formulário com dados válidos', async () => {
    // Arrange
    const mockSubmit = vi.fn();
    render(<UserForm onSubmit={mockSubmit} />);
    
    // Act
    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'João Silva' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joao@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'senha123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    
    // Assert
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123'
      });
    });
  });
});
```

---

### 2. Teste de Hook Customizado

```typescript
// frontend/src/hooks/__tests__/useAuth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear();
  });

  it('deve fazer login com credenciais válidas', async () => {
    // Arrange
    const { result } = renderHook(() => useAuth());
    
    // Act
    await act(async () => {
      await result.current.login('usuario@test.com', 'senha123');
    });
    
    // Assert
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeDefined();
    });
  });

  it('deve retornar erro ao fazer login com credenciais inválidas', async () => {
    // Arrange
    const { result } = renderHook(() => useAuth());
    
    // Act & Assert
    await act(async () => {
      await expect(
        result.current.login('invalido@test.com', 'senha-errada')
      ).rejects.toThrow('Credenciais inválidas');
    });
  });

  it('deve fazer logout e limpar dados do usuário', async () => {
    // Arrange
    const { result } = renderHook(() => useAuth());
    
    // Primeiro fazer login
    await act(async () => {
      await result.current.login('usuario@test.com', 'senha123');
    });
    
    // Act - Fazer logout
    act(() => {
      result.current.logout();
    });
    
    // Assert
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
```

---

### 3. Teste de API/Service

```typescript
// frontend/src/services/__tests__/userService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../userService';
import axios from 'axios';

vi.mock('axios');

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve registrar usuário com sucesso', async () => {
    // Arrange
    const mockResponse = {
      data: {
        id: '123',
        nome: 'João',
        email: 'joao@example.com'
      }
    };
    
    (axios.post as any).mockResolvedValue(mockResponse);
    
    const userData = {
      nome: 'João',
      email: 'joao@example.com',
      senha: 'senha123',
      papel: 'produtor'
    };
    
    // Act
    const result = await userService.register(userData);
    
    // Assert
    expect(result).toEqual(mockResponse.data);
    expect(axios.post).toHaveBeenCalledWith('/users/register', userData);
  });

  it('deve lançar erro quando registro falha', async () => {
    // Arrange
    const errorMessage = 'Email já cadastrado';
    (axios.post as any).mockRejectedValue({
      response: { data: { message: errorMessage } }
    });
    
    const userData = {
      nome: 'João',
      email: 'existe@example.com',
      senha: 'senha123',
      papel: 'produtor'
    };
    
    // Act & Assert
    await expect(userService.register(userData)).rejects.toThrow(errorMessage);
  });
});
```

---

### 4. Teste de Integração (E2E simplificado)

```typescript
// frontend/src/__tests__/integration/UserRegistration.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';

describe('Fluxo de Registro de Usuário', () => {
  it('deve completar o fluxo de registro com sucesso', async () => {
    // Arrange
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Act - Navegar para página de registro
    const registerButton = screen.getByRole('link', { name: /cadastrar/i });
    fireEvent.click(registerButton);
    
    // Preencher formulário
    await waitFor(() => {
      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'João Silva' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joao@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'senha123' }
    });
    
    // Submeter
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    
    // Assert - Deve redirecionar para dashboard
    await waitFor(() => {
      expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
```

---

## 🎯 Padrões e Boas Práticas

### 1. Arrange-Act-Assert (AAA)

```python
def test_exemplo():
    # Arrange (Preparar): Configure o estado inicial
    dados = {"nome": "Teste"}
    
    # Act (Agir): Execute a ação sendo testada
    resultado = funcao_a_testar(dados)
    
    # Assert (Verificar): Verifique o resultado esperado
    assert resultado == esperado
```

### 2. Nomenclatura de Testes

```python
# ❌ Ruim
def test_user():
    pass

# ✅ Bom
def test_criar_usuario_com_email_valido_deve_retornar_sucesso():
    pass
```

### 3. Testes Independentes

```python
# ❌ Ruim - testes dependentes
def test_1():
    global usuario
    usuario = criar_usuario()

def test_2():
    # Depende do test_1
    deletar_usuario(usuario)

# ✅ Bom - testes independentes
@pytest.fixture
def usuario():
    return criar_usuario()

def test_1(usuario):
    assert usuario is not None

def test_2(usuario):
    deletar_usuario(usuario)
```

---

## 📚 Recursos Adicionais

- [Pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [FastAPI Testing Guide](https://fastapi.tiangolo.com/tutorial/testing/)

---

**Dica Final**: Comece com testes simples e vá aumentando a complexidade gradualmente. O importante é ter cobertura dos casos principais!

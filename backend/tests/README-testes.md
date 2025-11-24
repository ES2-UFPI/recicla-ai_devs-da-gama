# 🧪 Guia de Testes - ReciclaAi Backend

Este documento explica como rodar os testes do projeto.

## 📋 Pré-requisitos

Certifique-se de que o `pytest` está instalado:

```bash
python -m pytest --version
```

Se não estiver instalado:
```bash
pip install pytest pytest-asyncio pytest-mock
```
Ou apenas
```bash
pip install -r requirements.txt
```

## 🚀 Como Rodar os Testes

### 1️⃣ Rodar todos os testes
```bash
python -m pytest tests/ -v
```

### 2️⃣ Rodar testes de um arquivo específico
```bash
python -m pytest tests/test_scheduling_coleta_integral.py -v
```

### 3️⃣ Rodar um teste específico
```bash
python -m pytest tests/test_scheduling_coleta_integral.py::TestColetaIntegralModel::test_scheduling_deve_ter_campo_coleta_integral -v
```

### 4️⃣ Rodar com mais detalhes (mostrar prints)
```bash
python -m pytest tests/ -v -s
```

### 5️⃣ Rodar com relatório de cobertura
```bash
python -m pytest tests/ --cov=src --cov-report=html
```

## 📊 Flags Úteis

- `-v` ou `--verbose`: Mostra informações detalhadas de cada teste
- `-s`: Mostra output dos prints (não captura stdout)
- `-x`: Para na primeira falha
- `--lf`: Roda apenas os testes que falharam na última execução
- `--tb=short`: Mostra traceback resumido
- `-k "nome"`: Roda apenas testes que contenham "nome"

## 🔍 Interpretando Resultados

### ✅ Teste passou
```
tests/test_scheduling_coleta_integral.py::TestColetaIntegralModel::test_exemplo PASSED [100%]
```

### ❌ Teste falhou
```
tests/test_scheduling_coleta_integral.py::TestColetaIntegralModel::test_exemplo FAILED [100%]
```

### ⏭️ Teste pulado
```
tests/test_scheduling_coleta_integral.py::TestColetaIntegralModel::test_exemplo SKIPPED [100%]
```

## 📚 Mais Informações

Para mais detalhes sobre pytest, consulte: https://docs.pytest.org/


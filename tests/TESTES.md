# Testes Locais - Portfolio Website

Este documento explica como executar os testes locais para validar as funcionalidades do site.

## 🚀 Quick Start

### Executar todos os testes

```bash
uv run pytest tests/ -v
```

## 📋 Testes Disponíveis

### 1. Testes Unitários (`tests/test_update_projects.py`)

Testa o script `update_projects.py`:

- ✅ Detecção de idioma (português vs inglês)
- ✅ Tradução de descrições
- ✅ Geração de HTML para projetos públicos e privados
- ✅ Manipulação de descrições None/vazias
- ✅ Mascaramento de repositórios privados
- ✅ Casos extremos (caracteres especiais, descrições longas, etc.)

**Executar:**

```bash
uv run pytest tests/test_update_projects.py -v
```

### 2. Testes de Estrutura (`tests/test_site_structure.py`)

Valida a estrutura do site:

- ✅ Arquivos obrigatórios existem
- ✅ Marcadores de projetos (PROJECTS_START/END)
- ✅ Scripts JavaScript necessários
- ✅ Folhas de estilo CSS
- ✅ Meta tags HTML
- ✅ Formulário de contato
- ✅ Contador de visitantes
- ✅ Validação de sintaxe JS básica (balanceamento de chaves)

**Executar:**

```bash
uv run pytest tests/test_site_structure.py -v
```

### 3. Testes de Variáveis de Ambiente (`tests/test_env_variables.py`)

Valida configuração de variáveis de ambiente:

- ✅ Arquivo `.env` existe e não está vazio
- ✅ Arquivo `.env.example` existe como modelo
- ✅ `.env` está no `.gitignore` (não será commitado)
- ✅ python-dotenv está instalado e funcionando
- ✅ Nenhum token hardcoded no código
- ✅ Variáveis são carregadas corretamente

**Executar:**

```bash
uv run pytest tests/test_env_variables.py -v
```

## 📊 Resumo de Comandos

| Comando | Descrição |
|---------|-----------|
| `uv run pytest tests/ -v` | Executar todos os testes (59 testes) |
| `uv run pytest tests/test_update_projects.py -v` | Apenas testes unitários (23 testes) |
| `uv run pytest tests/test_site_structure.py -v` | Apenas testes de estrutura (21 testes) |
| `uv run pytest tests/test_env_variables.py -v` | Apenas testes de variáveis de ambiente (15 testes) |
| `uv run pytest tests/ --cov=update_projects --cov-report=html` | Com relatório de cobertura |
| `uv run pytest tests/ -x` | Parar no primeiro erro |
| `uv run pytest tests/test_arquivo.py::TestClasse::test_metodo -v` | Teste específico |

## ✅ Resultado Esperado

Todos os testes devem passar:

```
================================================================================= 59 passed in ~0.35s ==================================================================================
```

## 🔐 Configurando Variáveis de Ambiente

### Primeiro Uso

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e adicione seus tokens:
   ```env
   PRIVATE_REPOS_TOKEN=ghp_seu_token_aqui
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
   FORMSPREE_ENDPOINT=https://formspree.io/f/...
   ```

3. Valide a configuração:
   ```bash
   uv run pytest tests/test_env_variables.py -v
   ```

### ⚠️ IMPORTANTE: Segurança

- **NUNCA** commite o arquivo `.env` (já está no `.gitignore`)
- Use tokens com permissões mínimas necessárias
- Rotacione tokens a cada 3-6 meses
- Para produção, use GitHub Actions secrets

## 🔧 Dependências

As dependências são gerenciadas pelo `uv`. Para instalar/atualizar:

```bash
uv sync --extra dev
```

Isto instalará:
- `pytest` - Framework de testes
- `pytest-cov` - Relatório de cobertura
- `requests` - Requisições HTTP (para update_projects.py)
- `python-dotenv` - Carregamento de variáveis de ambiente

## 📝 Adicionando Novos Testes

Para adicionar novos testes:

1. Crie um arquivo `tests/test_*.py`
2. Use classes `Test*` com métodos `test_*`
3. Use `pytest.fixture` para setup compartilhado
4. Execute com `uv run pytest tests/test_seu_teste.py -v`

Exemplo:

```python
import pytest
from pathlib import Path

class TestMinhaFuncionalidade:
    @pytest.fixture
    def dados(self):
        return {"nome": "teste", "valor": 42}

    def test_algo(self, dados):
        assert dados["valor"] == 42
```

## 🐛 Debugando Testes Falhando

Se um teste falhar:

```bash
# Ver saída detalhada
uv run pytest tests/test_arquivo.py -v --tb=long

# Executar apenas um teste específico
uv run pytest tests/test_arquivo.py::TestClasse::test_metodo -v

# Parar no primeiro erro
uv run pytest tests/ -x
```

## 📚 Documentação Adicional

- `AGENTS.md` - Instruções detalhadas do projeto
- `update_projects.py` - Script de atualização de projetos

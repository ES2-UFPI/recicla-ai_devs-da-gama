# Inicialização do pacote de testes
import sys
from pathlib import Path

# Adiciona o diretório src ao path para imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

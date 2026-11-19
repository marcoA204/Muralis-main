# Muralis Backend (Python / FastAPI)

Backend em Python para a plataforma **Muralis**, construído com **FastAPI**, **SQLAlchemy 2.0**, **PostgreSQL** e armazenamento S3 compatível (**MinIO** / **AWS S3**).

---

## 🚀 Tecnologias

- **Python 3.11+ / 3.13**
- **FastAPI**: Framework assíncrono para APIs REST modernas.
- **SQLAlchemy & Psycopg2**: ORM robusto para PostgreSQL.
- **Pydantic v2**: Validação e serialização automática com suporte a camelCase.
- **Boto3**: Integração com S3/MinIO para upload e URLs pré-assinadas.
- **PyJWT & Bcrypt**: Autenticação stateless via Bearer Token e hash seguro.

---

## 📦 Instalação e Execução Local

### 1. Criar e Ativar Ambiente Virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar Dependências

```bash
pip install -r requirements.txt
```

### 3. Subir Serviços de Apoio (PostgreSQL + MinIO)

Na raiz do repositório:
```bash
docker compose up -d postgres minio
```

### 4. Iniciar o Servidor FastAPI

```bash
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload
```

A documentação interativa Swagger estará disponível em:
- **Swagger UI**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **ReDoc**: [http://localhost:3000/redoc](http://localhost:3000/redoc)

---

## 🧪 Estrutura de Endpoints

- `GET /health`: Verificação de integridade da API.
- `POST /auth/register`: Cadastro de usuário.
- `POST /auth/login`: Login e emissão de tokens JWT.
- `GET /auth/me`: Perfil do usuário logado.
- `POST /assets/upload`: Upload de imagens (foto, arte, máscara) para MinIO/S3.
- `GET /assets/{id}`: Metadados e URL assinada do asset.
- `GET /assets/{id}/stream`: Streaming direto do arquivo do storage.
- `GET /projects`: Lista os murais/projetos do usuário logado.
- `POST /projects`: Cria um novo mural/projeto.
- `GET /projects/{id}`: Obtém detalhes de um mural.
- `PUT /projects/{id}`: Atualiza parâmetros (pontos de homografia, blend, opacidade).
- `DELETE /projects/{id}`: Remove o projeto.
- `POST /projects/{id}/share`: Cria link público de compartilhamento.
- `GET /share/{token}`: Visualização pública do projeto compartilhado.

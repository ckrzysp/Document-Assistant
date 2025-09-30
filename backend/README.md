# Backend Setup

## Prerequisites
- Python 3.13+
- MySQL/MariaDB database (SkySQL or local)

## Setup Instructions

### 1. Create Virtual Environment

```bash
# On Linux/Windows
python -m venv venv

# On MacBook (use python3 if python is not available)
python3 -m venv venv
```

### 2. Activate Virtual Environment

```bash
# On Linux/Mac
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
DB_PORT=4194
DB_NAME=sky
```

### 5. Run the Backend

```bash
uvicorn routes:app --reload
```

The server will start at: `http://127.0.0.1:8000`

## API Documentation

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
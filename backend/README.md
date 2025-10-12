# Click & Care Backend API


cd C:\Users\USER\Desktop\CnC_Mock\backend; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload


FastAPI backend for Click & Care medical platform with PostgreSQL database.

## 🚀 Features

- ✅ User (Patient) Authentication (Signup/Login)
- ✅ Doctor Authentication (Signup/Login with verification)
- ✅ JWT Token-based Authentication
- ✅ Password Hashing with Bcrypt
- ✅ PostgreSQL Database
- ✅ RESTful API Design
- ✅ CORS Support for Frontend
- ✅ Input Validation with Pydantic
- ✅ SQLAlchemy ORM

## 📋 Prerequisites

- Python 3.8 or higher
- PostgreSQL 12 or higher
- pip (Python package manager)

## 🛠️ Installation & Setup

### 1. Install PostgreSQL

#### Windows:
1. Download from https://www.postgresql.org/download/windows/
2. Run the installer
3. Remember your postgres user password

#### macOS:
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

Open PostgreSQL command line (psql):

```bash
# Windows
psql -U postgres

# macOS/Linux
sudo -u postgres psql
```

Create the database:
```sql
CREATE DATABASE click_and_care;
\q
```

### 3. Set Up Python Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` file with your database credentials:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/click_and_care
SECRET_KEY=your-secret-key-change-this-to-something-secure-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Important:** Generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5. Initialize Database

```bash
# Run database initialization
python scripts\init_db.py
```

### 6. Run the Server

```bash
# Development mode (with auto-reload)
uvicorn main:app --reload --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

Server will start at: http://localhost:8000

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 API Endpoints

### User (Patient) Endpoints

#### POST `/api/users/signup`
Register a new patient
```json
{
  "phone": "+8801234567890",
  "password": "securepassword"
}
```

#### POST `/api/users/login`
Login as patient
```json
{
  "phone": "+8801234567890",
  "password": "securepassword"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_type": "user",
  "user_data": {
    "id": 1,
    "phone": "+8801234567890",
    "role": "patient",
    "is_active": true
  }
}
```

#### GET `/api/users/profile`
Get current user profile (requires authentication)

### Doctor Endpoints

#### POST `/api/doctors/signup`
Register a new doctor
```json
{
  "phone": "+8801234567890",
  "password": "securepassword",
  "full_name": "Dr. John Doe",
  "specialization": "cardiologist",
  "license_number": "BMDC12345"
}
```

#### POST `/api/doctors/login`
Login as doctor
```json
{
  "phone": "+8801234567890",
  "password": "securepassword"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_type": "doctor",
  "user_data": {
    "id": 1,
    "phone": "+8801234567890",
    "full_name": "Dr. John Doe",
    "specialization": "cardiologist",
    "license_number": "BMDC12345",
    "is_verified": false,
    "is_active": true
  }
}
```

#### GET `/api/doctors/profile`
Get current doctor profile (requires authentication)

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## 🗄️ Database Schema

### Users Table
```sql
- id (SERIAL PRIMARY KEY)
- phone (VARCHAR UNIQUE)
- hashed_password (VARCHAR)
- role (VARCHAR DEFAULT 'patient')
- is_active (BOOLEAN DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Doctors Table
```sql
- id (SERIAL PRIMARY KEY)
- phone (VARCHAR UNIQUE)
- hashed_password (VARCHAR)
- full_name (VARCHAR)
- specialization (VARCHAR)
- license_number (VARCHAR UNIQUE)
- is_verified (BOOLEAN DEFAULT FALSE)
- is_active (BOOLEAN DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🧪 Testing the API

### Using cURL

```bash
# User Signup
curl -X POST http://localhost:8000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"phone": "+8801234567890", "password": "test123456"}'

# User Login
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+8801234567890", "password": "test123456"}'

# Doctor Signup
curl -X POST http://localhost:8000/api/doctors/signup \
  -H "Content-Type: application/json" \
  -d '{"phone": "+8801111111111", "password": "doctor123", "full_name": "Dr. Jane Smith", "specialization": "general", "license_number": "LIC001"}'
```

## 🐛 Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in .env file
- Ensure database exists: `CREATE DATABASE click_and_care;`

### Import Errors
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### Port Already in Use
- Change port: `uvicorn main:app --reload --port 8001`
- Or kill the process using port 8000

## 📦 Project Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── config.py                  # Configuration settings
├── database.py                # Database connection
├── models.py                  # SQLAlchemy models
├── schemas.py                 # Pydantic schemas
├── auth.py                    # Authentication utilities
├── init_db.py                 # Database initialization script
├── init_db.sql                # SQL schema
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
├── routers/                   # API route handlers
│   ├── __init__.py           # Router package initialization
│   ├── users.py              # User/patient endpoints
│   └── doctors.py            # Doctor endpoints
├── migrations/                # Database migration scripts
│   ├── README.md             # Migration documentation
│   ├── migrate_profile.py    # User profile migration
│   ├── migrate_doctor_profile.py  # Doctor profile migration
│   └── migrate_schedule.py   # Doctor schedule migration
├── uploads/                   # Uploaded files (certificates, images)
└── venv/                      # Python virtual environment
```

## 🔧 Development

### Adding New Endpoints
1. Create schema in `schemas.py`
2. Add route in appropriate router file
3. Test using Swagger UI at `/docs`

### Database Migrations
For schema changes, consider using Alembic:
```bash
pip install alembic
alembic init alembic
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## 🚀 Deployment

### Production Checklist
- [ ] Change SECRET_KEY to a secure random string
- [ ] Set strong database password
- [ ] Enable HTTPS
- [ ] Set up proper firewall rules
- [ ] Use environment-specific .env files
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring

## 📝 License

This project is part of the Click & Care platform.

## 👥 Support

For issues or questions, please contact the development team.

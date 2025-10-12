# Backend Utility Scripts

This folder contains utility scripts for database initialization, debugging, and testing.

## Scripts

### Database Initialization

#### `init_db.py`
Initializes the database with the required schema and tables.

**Usage:**
```bash
cd backend
.\venv\Scripts\Activate.ps1
python scripts\init_db.py
```

#### `init_db.sql`
SQL schema file used by `init_db.py` to create database tables.

### Testing & Debugging

#### `test_connection.py`
Tests the PostgreSQL database connection to ensure proper configuration.

**Usage:**
```bash
cd backend
.\venv\Scripts\Activate.ps1
python scripts\test_connection.py
```

**Expected Output:**
```
✓ Successfully connected to PostgreSQL
Database: click_and_care
User: postgres
```

#### `debug_signup.py`
Debug script for testing user signup functionality directly.

**Usage:**
```bash
cd backend
.\venv\Scripts\Activate.ps1
python scripts\debug_signup.py
```

## Notes

- All scripts should be run from the `backend` directory
- Activate the virtual environment before running any script
- Ensure `.env` file is properly configured with database credentials
- Check `config.py` for environment variable settings

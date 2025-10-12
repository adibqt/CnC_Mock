@echo off
echo ========================================
echo Click and Care - Backend Setup Script
echo ========================================
echo.

echo Step 1: Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment
    echo Make sure Python is installed and in PATH
    pause
    exit /b 1
)
echo ✓ Virtual environment created
echo.

echo Step 2: Activating virtual environment...
call venv\Scripts\activate
echo ✓ Virtual environment activated
echo.

echo Step 3: Installing dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo Step 4: Checking .env file...
if not exist .env (
    echo Creating .env file from example...
    copy .env.example .env
    echo.
    echo ⚠ IMPORTANT: Please edit .env file and update:
    echo   - DATABASE_URL with your PostgreSQL password
    echo   - SECRET_KEY with a secure random string
    echo.
    pause
) else (
    echo ✓ .env file already exists
)
echo.

echo Step 5: Initializing database...
python init_db.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to initialize database
    echo Make sure PostgreSQL is running and database exists
    echo Run this command in PostgreSQL: CREATE DATABASE click_and_care;
    pause
    exit /b 1
)
echo ✓ Database initialized
echo.

echo ========================================
echo Setup Complete! 🎉
echo ========================================
echo.
echo To start the backend server, run:
echo   venv\Scripts\activate
echo   uvicorn main:app --reload
echo.
echo Server will be available at: http://localhost:8000
echo API Documentation at: http://localhost:8000/docs
echo.
pause

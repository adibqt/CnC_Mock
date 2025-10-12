# 🚀 Quick Start Guide - Click & Care Full Stack

## Complete Setup (Frontend + Backend + Database)

### Step 1: Setup PostgreSQL Database

1. **Install PostgreSQL** (if not installed)
   - Windows: https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql && brew services start postgresql`
   - Linux: `sudo apt install postgresql && sudo systemctl start postgresql`

2. **Create Database**
   ```bash
   psql -U postgres
   ```
   ```sql
   CREATE DATABASE click_and_care;
   \q
   ```

### Step 2: Setup Backend

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Activate it:
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   # Copy example file
   cp .env.example .env
   
   # Edit .env and update:
   # - DATABASE_URL with your PostgreSQL password
   # - SECRET_KEY (generate one with: python -c "import secrets; print(secrets.token_urlsafe(32))")
   ```

5. **Initialize database**
   ```bash
   python init_db.py
   ```

6. **Start backend server**
   ```bash
   uvicorn main:app --reload
   ```
   
   ✅ Backend running at: http://localhost:8000
   📚 API Docs at: http://localhost:8000/docs

### Step 3: Setup Frontend

1. **Open new terminal** and navigate to project root
   ```bash
   cd ..
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start frontend dev server**
   ```bash
   npm run dev
   ```
   
   ✅ Frontend running at: http://localhost:5173 or http://localhost:5174

### Step 4: Test the Integration

1. **Open browser** and go to http://localhost:5173 (or 5174)

2. **Test User Signup/Login**
   - Click "Patient" button in header
   - Create a new account
   - Login with your credentials

3. **Test Doctor Signup/Login**
   - Click "Doctor" button in header
   - Fill in doctor registration form
   - Login after registration

## 🎯 Key URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:8000 | FastAPI server |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| API Redoc | http://localhost:8000/redoc | Alternative API documentation |

## 🔑 Default Credentials for Testing

Create your own accounts through the signup forms!

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Check if PostgreSQL is running
# Windows: services.msc (look for PostgreSQL)
# macOS: brew services list
# Linux: sudo systemctl status postgresql

# Check if port 8000 is available
# Windows: netstat -ano | findstr :8000
# macOS/Linux: lsof -i :8000
```

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try different port
npm run dev -- --port 3000
```

### Database connection errors
```bash
# Verify database exists
psql -U postgres -c "\l" | grep click_and_care

# Recreate database if needed
psql -U postgres -c "DROP DATABASE IF EXISTS click_and_care;"
psql -U postgres -c "CREATE DATABASE click_and_care;"
python backend/init_db.py
```

### API calls failing
- Check if backend is running (http://localhost:8000/health)
- Check browser console for CORS errors
- Verify `.env` file has correct `VITE_API_URL`

## 📱 Testing the Application

### Patient Flow
1. Go to homepage
2. Click "Patient" login button
3. Click "Sign up here"
4. Enter phone number and password
5. After signup, login with your credentials
6. You'll be redirected to homepage (authenticated)

### Doctor Flow
1. Go to homepage
2. Click "Doctor" login button
3. Click "Register here"
4. Fill in all doctor details:
   - Full Name
   - Specialization
   - Medical License Number
   - Phone & Password
5. After registration, login with your credentials
6. You'll be redirected to homepage (authenticated)

## 🔐 Security Notes

- Passwords are hashed with bcrypt
- JWT tokens expire in 30 minutes
- Tokens are stored in localStorage
- CORS is configured for frontend origin

## 📊 Database Tables

After initialization, you'll have:
- `users` table (for patients)
- `doctors` table (for doctors)

View in PostgreSQL:
```bash
psql -U postgres -d click_and_care
\dt
SELECT * FROM users;
SELECT * FROM doctors;
\q
```

## 🎉 Success Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `click_and_care` created
- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 5173/5174
- [ ] Can access API docs at /docs
- [ ] Can signup as patient
- [ ] Can login as patient
- [ ] Can signup as doctor
- [ ] Can login as doctor
- [ ] No console errors in browser

## 🆘 Need Help?

If you encounter any issues:
1. Check the detailed README.md in the backend folder
2. Verify all services are running
3. Check browser console for frontend errors
4. Check terminal for backend errors
5. Ensure PostgreSQL is accessible

Happy coding! 🚀

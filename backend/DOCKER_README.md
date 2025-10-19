
Complete guide to dockerize and run the Click & Care FastAPI backend.

##  Prerequisites

- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)
- Git (for cloning the repository)

##  Quick Start

### 1. Setup Environment Variables

```powershell
# Copy the Docker environment template
Copy-Item .env.docker .env

# Edit .env with your values (important!)
notepad .env
```

**Important**: Update at minimum:
- `SECRET_KEY` - Generate a secure random string (32+ characters)
- `GEMINI_API_KEY` - If using AI features
- `LIVEKIT_*` - If using video call features

### 2. Build and Start Services

```powershell
# Build and start all services (PostgreSQL + Backend)
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

### 3. Run Database Migrations

```powershell
# If backend is running, execute migrations inside the container
docker-compose exec backend python migrations/migrate_admin.py
docker-compose exec backend python migrations/migrate_profile.py
docker-compose exec backend python migrations/migrate_doctor_profile.py
docker-compose exec backend python migrations/migrate_schedule.py
docker-compose exec backend python migrations/migrate_appointments.py
docker-compose exec backend python migrations/migrate_ai_consultations.py
docker-compose exec backend python migrations/migrate_prescriptions.py
```

### 4. Access the Application

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Health Check**: http://localhost:8000/health
- **PostgreSQL**: localhost:5432
- **pgAdmin** (optional): http://localhost:5050

##  Docker Services

### Backend Service
- **Image**: Custom Python 3.11 image
- **Port**: 8000
- **Features**: Hot reload enabled for development
- **Volumes**: Code and uploads mounted

### PostgreSQL Service
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Data**: Persisted in Docker volume `postgres_data`

### pgAdmin Service (Optional)
- **Image**: dpage/pgadmin4
- **Port**: 5050
- **Credentials**: Set in `.env` (PGADMIN_EMAIL/PASSWORD)

To start with pgAdmin:
```powershell
docker-compose --profile tools up -d
```

##  Common Commands

### Managing Containers

```powershell
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# Restart a specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend

# View all logs
docker-compose logs -f
```

### Building Images

```powershell
# Rebuild images
docker-compose build

# Rebuild without cache
docker-compose build --no-cache

# Rebuild specific service
docker-compose build backend
```

### Accessing Containers

```powershell
# Execute command in running container
docker-compose exec backend bash

# Run Python shell
docker-compose exec backend python

# Check container status
docker-compose ps

# View resource usage
docker stats
```

### Database Operations

```powershell
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d click_and_care

# Backup database
docker-compose exec postgres pg_dump -U postgres click_and_care > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d click_and_care

# View database logs
docker-compose logs postgres
```

##  Development Workflow

### Hot Reload Development

The docker-compose.yml is configured for development with:
- Code volume mount for hot reload
- `--reload` flag on uvicorn
- Port forwarding to localhost

Make code changes and see them reflected immediately!

### Running Migrations

```powershell
# Run all migrations
docker-compose exec backend python migrations/migrate_admin.py

# Run specific migration
docker-compose exec backend python migrations/migrate_appointments.py
```

### Installing New Python Packages

```powershell
# 1. Add package to requirements.txt
echo "new-package==1.0.0" >> requirements.txt

# 2. Rebuild backend image
docker-compose build backend

# 3. Restart backend
docker-compose up -d backend
```

### Testing

```powershell
# Run tests inside container
docker-compose exec backend pytest

# Run specific test file
docker-compose exec backend pytest tests/test_api.py

# Run with coverage
docker-compose exec backend pytest --cov=.
```

## 🔒 Production Considerations

### 1. Update docker-compose for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    # Remove volume mounts
    # volumes: []
    # Use production command (no --reload)
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
    environment:
      ENVIRONMENT: production
```

### 2. Use Production Environment

```powershell
# Use production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. Security Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Update CORS_ORIGINS to your production domain
- [ ] Don't mount code volumes in production
- [ ] Use Docker secrets for sensitive data
- [ ] Set `ENVIRONMENT=production`
- [ ] Use `--workers 4` (or more) for uvicorn


```






**Default Credentials** (⚠️ Change in production):
- Admin: username=`admin`, password=`admin123`
- PostgreSQL: user=`postgres`, password=`postgres`
- pgAdmin: email=`admin@clickandcare.com`, password=`admin`

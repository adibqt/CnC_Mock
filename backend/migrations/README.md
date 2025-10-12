# Database Migrations

This folder contains database migration scripts for the Click & Care application.

## Migration Files

- `migrate_profile.py` - Initial user profile migration
- `migrate_doctor_profile.py` - Doctor profile fields migration
- `migrate_schedule.py` - Doctor schedule column migration

## Running Migrations

To run a migration, use the following command from the backend directory:

```bash
# Activate virtual environment first
.\venv\Scripts\Activate.ps1

# Run specific migration
python migrations\migrate_profile.py
python migrations\migrate_doctor_profile.py
python migrations\migrate_schedule.py
```

## Creating New Migrations

When creating a new migration:

1. Name the file descriptively: `migrate_<feature_name>.py`
2. Include database connection setup
3. Add proper error handling
4. Include success/failure messages
5. Test thoroughly before committing

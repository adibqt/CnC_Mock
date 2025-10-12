"""
Routers package for Click & Care API endpoints.
"""

from .users import router as users_router
from .doctors import router as doctors_router
from .ai import router as ai_router

__all__ = ['users_router', 'doctors_router', 'ai_router']

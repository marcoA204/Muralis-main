from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import EmailStr
from app.schemas.base import CamelModel

class UserRegister(CamelModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(CamelModel):
    email: EmailStr
    password: str

class UserProfile(CamelModel):
    id: UUID
    name: str
    email: str
    plan: str
    created_at: Optional[datetime] = None

class AuthResponseUser(CamelModel):
    id: UUID
    name: str
    email: str
    plan: str

class AuthResponse(CamelModel):
    user: AuthResponseUser
    token: str
    refresh_token: str

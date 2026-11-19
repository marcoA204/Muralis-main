from typing import Optional
from datetime import datetime
from uuid import UUID
from app.schemas.base import CamelModel

class AssetSchema(CamelModel):
    id: UUID
    owner_id: UUID
    type: str
    storage_key: str
    width: Optional[int] = None
    height: Optional[int] = None
    mime_type: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class AssetResponse(CamelModel):
    asset: AssetSchema
    url: str

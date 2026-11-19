from typing import Optional, Any, Dict
from datetime import datetime
from uuid import UUID
from app.schemas.base import CamelModel

class ShareTokenInfo(CamelModel):
    token: str
    expires_at: Optional[datetime] = None

class SharedAssetInfo(CamelModel):
    id: UUID
    type: str
    storage_key: str
    mime_type: str
    url: Optional[str] = None

class SharedProjectResponse(CamelModel):
    share: ShareTokenInfo
    project: Dict[str, Any]

class ShareRecord(CamelModel):
    id: UUID
    project_id: UUID
    token: str
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

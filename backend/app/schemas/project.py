from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from app.schemas.base import CamelModel
from app.schemas.asset import AssetSchema

class Point2D(CamelModel):
    x: float
    y: float

class ProjectCreate(CamelModel):
    title: Optional[str] = "Untitled Project"
    base_photo_id: Optional[UUID] = None
    art_asset_id: Optional[UUID] = None
    mask_asset_id: Optional[UUID] = None
    corner_points: Optional[List[Point2D]] = None
    blend_mode: Optional[str] = "multiply"
    opacity: Optional[float] = 0.9
    brightness: Optional[float] = 1.0
    contrast: Optional[float] = 1.0

class ProjectUpdate(CamelModel):
    title: Optional[str] = None
    base_photo_id: Optional[UUID] = None
    art_asset_id: Optional[UUID] = None
    mask_asset_id: Optional[UUID] = None
    corner_points: Optional[List[Point2D]] = None
    blend_mode: Optional[str] = None
    opacity: Optional[float] = None
    brightness: Optional[float] = None
    contrast: Optional[float] = None
    status: Optional[str] = None

class ShareShort(CamelModel):
    id: UUID
    token: str
    expires_at: Optional[datetime] = None

class ProjectResponse(CamelModel):
    id: UUID
    user_id: UUID
    title: str
    base_photo_id: Optional[UUID] = None
    art_asset_id: Optional[UUID] = None
    mask_asset_id: Optional[UUID] = None
    corner_points: List[Any]
    blend_mode: str
    opacity: float
    brightness: float
    contrast: float
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    base_photo: Optional[AssetSchema] = None
    art_asset: Optional[AssetSchema] = None
    mask_asset: Optional[AssetSchema] = None
    shares: Optional[List[ShareShort]] = None

class ShareCreate(CamelModel):
    expires_in_days: Optional[int] = None

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False, default="Untitled Project")
    base_photo_id = Column(Uuid(as_uuid=True), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    art_asset_id = Column(Uuid(as_uuid=True), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    mask_asset_id = Column(Uuid(as_uuid=True), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    corner_points = Column(JSON, nullable=False, default=lambda: [
        {"x": 0.1, "y": 0.1},
        {"x": 0.9, "y": 0.1},
        {"x": 0.9, "y": 0.9},
        {"x": 0.1, "y": 0.9}
    ])
    blend_mode = Column(String(50), nullable=False, default="multiply")
    opacity = Column(Float, nullable=False, default=0.9)
    brightness = Column(Float, nullable=False, default=1.0)
    contrast = Column(Float, nullable=False, default=1.0)
    status = Column(String(50), nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="projects")
    base_photo = relationship("Asset", foreign_keys=[base_photo_id])
    art_asset = relationship("Asset", foreign_keys=[art_asset_id])
    mask_asset = relationship("Asset", foreign_keys=[mask_asset_id])
    shares = relationship("Share", back_populates="project", cascade="all, delete-orphan")

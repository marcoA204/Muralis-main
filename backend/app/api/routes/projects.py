import uuid
from uuid import UUID
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.share import Share
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ShareCreate
from app.schemas.share import ShareRecord

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    corner_points_data = [p.model_dump() for p in payload.corner_points] if payload.corner_points else [
        {"x": 0.1, "y": 0.1},
        {"x": 0.9, "y": 0.1},
        {"x": 0.9, "y": 0.9},
        {"x": 0.1, "y": 0.9}
    ]

    project = Project(
        user_id=current_user.id,
        title=payload.title or "Untitled Project",
        base_photo_id=payload.base_photo_id,
        art_asset_id=payload.art_asset_id,
        mask_asset_id=payload.mask_asset_id,
        corner_points=corner_points_data,
        blend_mode=payload.blend_mode or "multiply",
        opacity=payload.opacity if payload.opacity is not None else 0.9,
        brightness=payload.brightness if payload.brightness is not None else 1.0,
        contrast=payload.contrast if payload.contrast is not None else 1.0,
        status="draft"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("", response_model=List[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.updated_at.desc())
        .all()
    )
    return projects

@router.get("/{id}", response_model=ProjectResponse)
def get_project(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = (
        db.query(Project)
        .filter(Project.id == id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{id}", response_model=ProjectResponse)
def update_project(
    id: UUID,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = (
        db.query(Project)
        .filter(Project.id == id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_dict = payload.model_dump(exclude_unset=True)
    if "corner_points" in update_dict and update_dict["corner_points"] is not None:
        update_dict["corner_points"] = [
            p.model_dump() if hasattr(p, "model_dump") else p
            for p in payload.corner_points
        ]

    for field, val in update_dict.items():
        setattr(project, field, val)

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{id}")
def delete_project(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = (
        db.query(Project)
        .filter(Project.id == id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.post("/{id}/share", response_model=ShareRecord, status_code=status.HTTP_201_CREATED)
def create_share_token(
    id: UUID,
    payload: ShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = (
        db.query(Project)
        .filter(Project.id == id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    token = uuid.uuid4().hex
    expires_at = None
    if payload.expires_in_days and payload.expires_in_days > 0:
        expires_at = datetime.now(timezone.utc) + timedelta(days=payload.expires_in_days)

    share = Share(
        project_id=project.id,
        token=token,
        expires_at=expires_at
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return share

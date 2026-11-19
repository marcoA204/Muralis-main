from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api.deps import get_db
from app.models.share import Share
from app.schemas.share import SharedProjectResponse
from app.services.storage import generate_presigned_url

router = APIRouter(prefix="/share", tags=["share"])

@router.get("/{token}", response_model=SharedProjectResponse)
def get_shared_project(token: str, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    share = (
        db.query(Share)
        .filter(
            Share.token == token,
            or_(Share.expires_at == None, Share.expires_at > now)
        )
        .first()
    )

    if not share or not share.project:
        raise HTTPException(status_code=404, detail="Share link invalid or expired")

    proj = share.project
    
    base_photo_dict = None
    if proj.base_photo:
        base_photo_dict = {
            "id": str(proj.base_photo.id),
            "storageKey": proj.base_photo.storage_key,
            "mimeType": proj.base_photo.mime_type,
            "url": generate_presigned_url(proj.base_photo.storage_key, expires_in=14400)
        }

    art_asset_dict = None
    if proj.art_asset:
        art_asset_dict = {
            "id": str(proj.art_asset.id),
            "storageKey": proj.art_asset.storage_key,
            "mimeType": proj.art_asset.mime_type,
            "url": generate_presigned_url(proj.art_asset.storage_key, expires_in=14400)
        }

    mask_asset_dict = None
    if proj.mask_asset:
        mask_asset_dict = {
            "id": str(proj.mask_asset.id),
            "storageKey": proj.mask_asset.storage_key,
            "mimeType": proj.mask_asset.mime_type,
            "url": generate_presigned_url(proj.mask_asset.storage_key, expires_in=14400)
        }

    project_data = {
        "id": str(proj.id),
        "userId": str(proj.user_id),
        "title": proj.title,
        "basePhotoId": str(proj.base_photo_id) if proj.base_photo_id else None,
        "artAssetId": str(proj.art_asset_id) if proj.art_asset_id else None,
        "maskAssetId": str(proj.mask_asset_id) if proj.mask_asset_id else None,
        "cornerPoints": proj.corner_points,
        "blendMode": proj.blend_mode,
        "opacity": proj.opacity,
        "brightness": proj.brightness,
        "contrast": proj.contrast,
        "status": proj.status,
        "createdAt": proj.created_at.isoformat() if proj.created_at else None,
        "updatedAt": proj.updated_at.isoformat() if proj.updated_at else None,
        "basePhoto": base_photo_dict,
        "artAsset": art_asset_dict,
        "maskAsset": mask_asset_dict
    }

    return {
        "share": {
            "token": share.token,
            "expiresAt": share.expires_at
        },
        "project": project_data
    }

import uuid
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.asset import Asset
from app.schemas.asset import AssetResponse
from app.services.storage import upload_file, generate_presigned_url, get_file_bytes_or_stream

router = APIRouter(prefix="/assets", tags=["assets"])

@router.post("/upload", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def upload_asset(
    file: UploadFile = File(...),
    type: str = Form("photo"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    file_bytes = await file.read()
    extension = file.filename.split(".")[-1] if "." in file.filename else "bin"
    storage_key = f"{current_user.id}/{type}_{uuid.uuid4()}.{extension}"
    content_type = file.content_type or "application/octet-stream"

    upload_file(file_bytes, storage_key, content_type)

    asset = Asset(
        owner_id=current_user.id,
        type=type,
        storage_key=storage_key,
        mime_type=content_type
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    signed_url = generate_presigned_url(storage_key, expires_in=86400, asset_id=str(asset.id))

    return {
        "asset": asset,
        "url": signed_url
    }

@router.get("/{id}", response_model=AssetResponse)
def get_asset(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    signed_url = generate_presigned_url(asset.storage_key, expires_in=86400, asset_id=str(asset.id))
    return {
        "asset": asset,
        "url": signed_url
    }

@router.get("/{id}/stream")
def stream_asset(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    try:
        body = get_file_bytes_or_stream(asset.storage_key)
        return StreamingResponse(body, media_type=asset.mime_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stream asset: {str(e)}")

from fastapi import APIRouter, HTTPException, Depends, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.db.database import get_db
from app.models.schemas import MitigationCreate, Mitigation
from app.db.models import MitigationRecord, Customer, RiskPredictionRecord

router = APIRouter()

@router.post("/", response_model=Mitigation)
async def create_mitigation(
    mitigation: MitigationCreate,
    db: Session = Depends(get_db)
):
    """
    Apply a mitigation measure to a high-risk customer.
    """
    try:
        # Check if customer exists
        customer = db.query(Customer).filter(Customer.id == mitigation.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Verify customer is high-risk
        latest_prediction = db.query(RiskPredictionRecord).filter(
            RiskPredictionRecord.customer_id == mitigation.customer_id
        ).order_by(
            RiskPredictionRecord.prediction_timestamp.desc()
        ).first()
        
        if not latest_prediction or latest_prediction.risk_level != "High":
            raise HTTPException(
                status_code=400, 
                detail="Mitigations can only be applied to high-risk customers"
            )
        
        # Create mitigation record
        db_mitigation = MitigationRecord(
            customer_id=mitigation.customer_id,
            risk_level=mitigation.risk_level,
            mitigation_type=mitigation.mitigation_type,
            description=mitigation.description,
            assigned_to=mitigation.assigned_to,
            due_date=mitigation.due_date,
            status="Pending"
        )
        
        db.add(db_mitigation)
        db.commit()
        db.refresh(db_mitigation)
        
        return db_mitigation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create mitigation: {str(e)}")

@router.get("/", response_model=List[Mitigation])
async def list_mitigations(
    customer_id: Optional[UUID] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    List mitigation measures with optional filtering.
    """
    try:
        query = db.query(MitigationRecord)
        
        # Apply filters
        if customer_id:
            query = query.filter(MitigationRecord.customer_id == customer_id)
        
        if status:
            query = query.filter(MitigationRecord.status == status)
        
        # Apply pagination
        mitigations = query.order_by(
            MitigationRecord.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return mitigations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list mitigations: {str(e)}")

@router.get("/{mitigation_id}", response_model=Mitigation)
async def get_mitigation(
    mitigation_id: UUID = Path(...),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific mitigation measure.
    """
    mitigation = db.query(MitigationRecord).filter(MitigationRecord.id == mitigation_id).first()
    if not mitigation:
        raise HTTPException(status_code=404, detail="Mitigation not found")
    
    return mitigation

@router.put("/{mitigation_id}/status", response_model=Mitigation)
async def update_mitigation_status(
    mitigation_id: UUID = Path(...),
    status: str = Query(..., description="New status - Pending, In Progress, Completed, Cancelled"),
    db: Session = Depends(get_db)
):
    """
    Update the status of a mitigation measure.
    """
    valid_statuses = ["Pending", "In Progress", "Completed", "Cancelled"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    mitigation = db.query(MitigationRecord).filter(MitigationRecord.id == mitigation_id).first()
    if not mitigation:
        raise HTTPException(status_code=404, detail="Mitigation not found")
    
    mitigation.status = status
    mitigation.updated_at = datetime.utcnow()
    
    db.add(mitigation)
    db.commit()
    db.refresh(mitigation)
    
    return mitigation
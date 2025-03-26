from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.db.database import get_db
from app.models.schemas import CustomerBase, CustomerCreate, CustomerWithFeatures, CustomerFeatures
from app.db.models import Customer, CustomerFeatureRecord, RiskPredictionRecord
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[CustomerWithFeatures])
async def list_customers(
    risk_level: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    List all customers with optional filtering by risk level.
    """
    query = db.query(Customer)
    
    # Apply risk level filter if provided
    if risk_level:
        # Subquery to get the latest prediction for each customer
        latest_predictions = db.query(
            RiskPredictionRecord.customer_id,
            RiskPredictionRecord.risk_level
        ).distinct(
            RiskPredictionRecord.customer_id
        ).order_by(
            RiskPredictionRecord.customer_id,
            RiskPredictionRecord.prediction_timestamp.desc()
        ).subquery()
        
        # Filter by risk level
        query = query.join(
            latest_predictions,
            Customer.id == latest_predictions.c.customer_id
        ).filter(
            latest_predictions.c.risk_level == risk_level
        )
    
    # Apply pagination
    customers = query.offset(skip).limit(limit).all()
    
    # Transform to response model
    result = []
    for customer in customers:
        # Get latest prediction
        latest_prediction = db.query(RiskPredictionRecord).filter(
            RiskPredictionRecord.customer_id == customer.id
        ).order_by(
            RiskPredictionRecord.prediction_timestamp.desc()
        ).first()
        
        # Get customer features
        features_records = db.query(CustomerFeatureRecord).filter(
            CustomerFeatureRecord.customer_id == customer.id
        ).all()
        
        features = {}
        for feature in features_records:
            features[feature.feature_name] = feature.feature_value
        
        # Create response object
        customer_data = {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "phone": customer.phone,
            "external_id": customer.external_id,
            "created_at": customer.created_at,
            "updated_at": customer.updated_at,
            "features": features
        }
        
        if latest_prediction:
            customer_data["risk_level"] = latest_prediction.risk_level
            customer_data["confidence_score"] = latest_prediction.confidence_score
            customer_data["last_prediction"] = latest_prediction.prediction_timestamp
        
        result.append(customer_data)
    
    return result

@router.get("/{customer_id}", response_model=CustomerWithFeatures)
async def get_customer(
    customer_id: UUID = Path(...),
    db: Session = Depends(get_db)
):
    """
    Get a specific customer by ID.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get latest prediction
    latest_prediction = db.query(RiskPredictionRecord).filter(
        RiskPredictionRecord.customer_id == customer.id
    ).order_by(
        RiskPredictionRecord.prediction_timestamp.desc()
    ).first()
    
    # Get customer features
    features_records = db.query(CustomerFeatureRecord).filter(
        CustomerFeatureRecord.customer_id == customer.id
    ).all()
    
    features = {}
    for feature in features_records:
        features[feature.feature_name] = feature.feature_value
    
    # Create response object
    customer_data = {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "external_id": customer.external_id,
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
        "features": features
    }
    
    if latest_prediction:
        customer_data["risk_level"] = latest_prediction.risk_level
        customer_data["confidence_score"] = latest_prediction.confidence_score
        customer_data["last_prediction"] = latest_prediction.prediction_timestamp
    
    return customer_data

@router.post("/", response_model=CustomerWithFeatures)
async def create_customer(
    customer: CustomerCreate,
    features: Optional[CustomerFeatures] = None,
    db: Session = Depends(get_db)
):
    """
    Create a new customer with optional features.
    """
    db_customer = Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        external_id=customer.external_id
    )
    
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    # Add features if provided
    if features:
        for feature_name, feature_value in features.dict(exclude_unset=True).items():
            if feature_value is not None:
                db_feature = CustomerFeatureRecord(
                    customer_id=db_customer.id,
                    feature_name=feature_name,
                    feature_value=float(feature_value)
                )
                db.add(db_feature)
        
        db.commit()
    
    # Return the created customer
    return await get_customer(db_customer.id, db)

@router.put("/{customer_id}", response_model=CustomerWithFeatures)
async def update_customer(
    customer_id: UUID,
    customer_update: CustomerBase,
    features_update: Optional[CustomerFeatures] = None,
    db: Session = Depends(get_db)
):
    """
    Update a customer's information and/or features.
    """
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update customer details
    for key, value in customer_update.dict(exclude_unset=True).items():
        setattr(db_customer, key, value)
    
    db_customer.updated_at = datetime.utcnow()
    db.commit()
    
    # Update features if provided
    if features_update:
        for feature_name, feature_value in features_update.dict(exclude_unset=True).items():
            if feature_value is not None:
                # Check if feature exists
                existing_feature = db.query(CustomerFeatureRecord).filter(
                    CustomerFeatureRecord.customer_id == customer_id,
                    CustomerFeatureRecord.feature_name == feature_name
                ).first()
                
                if existing_feature:
                    existing_feature.feature_value = float(feature_value)
                    existing_feature.recorded_at = datetime.utcnow()
                else:
                    db_feature = CustomerFeatureRecord(
                        customer_id=customer_id,
                        feature_name=feature_name,
                        feature_value=float(feature_value)
                    )
                    db.add(db_feature)
        
        db.commit()
    
    # Return the updated customer
    return await get_customer(customer_id, db)

@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete a customer and all associated records.
    """
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Delete associated records
    db.query(RiskPredictionRecord).filter(RiskPredictionRecord.customer_id == customer_id).delete()
    db.query(CustomerFeatureRecord).filter(CustomerFeatureRecord.customer_id == customer_id).delete()
    
    # Delete customer
    db.delete(db_customer)
    db.commit()
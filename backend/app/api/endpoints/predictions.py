
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.schemas import RiskPredictionCreate, RiskPrediction, RiskDistribution
from app.models.ml_model import risk_model
from app.db.models import Customer, RiskPredictionRecord

router = APIRouter()

@router.post("/predict", response_model=RiskPrediction)
async def predict_customer_risk(
    prediction_data: RiskPredictionCreate,
    db: Session = Depends(get_db)
):
    """
    Predict risk level for a customer based on their features.
    """
    try:
        # Check if customer exists
        customer = db.query(Customer).filter(Customer.id == prediction_data.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Make prediction
        prediction_result = risk_model.predict(prediction_data.customer_features.dict())
        
        # Save prediction to database
        db_prediction = RiskPredictionRecord(
            customer_id=prediction_data.customer_id,
            risk_level=prediction_result["risk_level"],
            confidence_score=prediction_result.get("confidence_score")
        )
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)
        
        return db_prediction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/statistics", response_model=RiskDistribution)
async def get_risk_distribution(db: Session = Depends(get_db)):
    """
    Get distribution of customers across risk categories.
    """
    try:
        # Get the latest risk level for each customer
        subquery = db.query(
            RiskPredictionRecord.customer_id,
            RiskPredictionRecord.risk_level
        ).distinct(
            RiskPredictionRecord.customer_id
        ).order_by(
            RiskPredictionRecord.customer_id,
            RiskPredictionRecord.prediction_timestamp.desc()
        ).subquery()
        
        # Count customers in each risk category
        low_risk = db.query(subquery).filter(subquery.c.risk_level == "Low").count()
        medium_risk = db.query(subquery).filter(subquery.c.risk_level == "Medium").count()
        high_risk = db.query(subquery).filter(subquery.c.risk_level == "High").count()
        
        total_customers = low_risk + medium_risk + high_risk
        
        return {
            "low_risk_count": low_risk,
            "medium_risk_count": medium_risk,
            "high_risk_count": high_risk,
            "total_customers": total_customers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve risk statistics: {str(e)}")
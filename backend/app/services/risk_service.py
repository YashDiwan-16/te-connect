from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timedelta

from app.db.models import Customer, RiskPredictionRecord, MitigationRecord, CustomerFeatureRecord
from app.models.ml_model import risk_model

class RiskService:
    """Service for handling risk-related business logic."""
    
    @staticmethod
    def predict_customer_risk(
        db: Session, 
        customer_id: UUID, 
        features: Dict[str, Any]
    ) -> RiskPredictionRecord:
        """
        Predict risk for a customer and store the prediction.
        
        Args:
            db: Database session
            customer_id: UUID of the customer
            features: Dictionary of customer features
            
        Returns:
            The created risk prediction record
        """
        # Check if customer exists
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise ValueError("Customer not found")
        
        # Make prediction
        prediction_result = risk_model.predict(features)
        
        # Save prediction to database
        db_prediction = RiskPredictionRecord(
            customer_id=customer_id,
            risk_level=prediction_result["risk_level"],
            confidence_score=prediction_result.get("confidence_score")
        )
        
        db.add(db_prediction)
        
        # Store features for future reference
        for feature_name, feature_value in features.items():
            if feature_value is not None and isinstance(feature_value, (int, float)):
                db_feature = CustomerFeatureRecord(
                    customer_id=customer_id,
                    feature_name=feature_name,
                    feature_value=float(feature_value)
                )
                db.add(db_feature)
        
        db.commit()
        db.refresh(db_prediction)
        
        return db_prediction
    
    @staticmethod
    def get_risk_distribution(db: Session) -> Dict[str, int]:
        """
        Get the distribution of customers across risk categories.
        
        Args:
            db: Database session
            
        Returns:
            Dictionary with counts for each risk level
        """
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
        
        total_customers = db.query(Customer).count()
        
        return {
            "low_risk_count": low_risk,
            "medium_risk_count": medium_risk,
            "high_risk_count": high_risk,
            "total_customers": total_customers,
            "last_updated": datetime.utcnow()
        }
    
    @staticmethod
    def get_high_risk_customers(
        db: Session, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Tuple[Customer, RiskPredictionRecord]]:
        """
        Get list of high-risk customers with their latest predictions.
        
        Args:
            db: Database session
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            
        Returns:
            List of (customer, prediction) tuples
        """
        # Subquery to get the latest prediction for each customer
        latest_predictions = db.query(
            RiskPredictionRecord.customer_id,
            RiskPredictionRecord.id.label('prediction_id')
        ).distinct(
            RiskPredictionRecord.customer_id
        ).order_by(
            RiskPredictionRecord.customer_id,
            RiskPredictionRecord.prediction_timestamp.desc()
        ).subquery()
        
        # Query to get high-risk customers with their predictions
        query = (
            db.query(Customer, RiskPredictionRecord)
            .join(latest_predictions, Customer.id == latest_predictions.c.customer_id)
            .join(
                RiskPredictionRecord,
                RiskPredictionRecord.id == latest_predictions.c.prediction_id
            )
            .filter(RiskPredictionRecord.risk_level == "High")
            .order_by(RiskPredictionRecord.prediction_timestamp.desc())
            .offset(skip)
            .limit(limit)
        )
        
        return query.all()
    
    @staticmethod
    def get_pending_mitigations(
        db: Session, 
        days_threshold: int = 7
    ) -> List[MitigationRecord]:
        """
        Get list of pending mitigations that are due soon.
        
        Args:
            db: Database session
            days_threshold: Number of days to consider as "due soon"
            
        Returns:
            List of mitigation records
        """
        due_date_threshold = datetime.utcnow() + timedelta(days=days_threshold)
        
        query = (
            db.query(MitigationRecord)
            .filter(
                MitigationRecord.status.in_(["Pending", "In Progress"]),
                MitigationRecord.due_date <= due_date_threshold
            )
            .order_by(MitigationRecord.due_date)
        )
        
        return query.all()
    
    @staticmethod
    def get_customer_risk_history(
        db: Session, 
        customer_id: UUID,
        limit: int = 10
    ) -> List[RiskPredictionRecord]:
        """
        Get risk prediction history for a specific customer.
        
        Args:
            db: Database session
            customer_id: UUID of the customer
            limit: Maximum number of records to return
            
        Returns:
            List of risk prediction records
        """
        query = (
            db.query(RiskPredictionRecord)
            .filter(RiskPredictionRecord.customer_id == customer_id)
            .order_by(RiskPredictionRecord.prediction_timestamp.desc())
            .limit(limit)
        )
        
        return query.all()
    
    @staticmethod
    def get_customer_features(
        db: Session, 
        customer_id: UUID
    ) -> Dict[str, float]:
        """
        Get the latest features for a customer.
        
        Args:
            db: Database session
            customer_id: UUID of the customer
            
        Returns:
            Dictionary of feature names and values
        """
        # Get the latest feature value for each feature name
        features = {}
        
        # Group by feature name and get the latest record for each
        subquery = (
            db.query(
                CustomerFeatureRecord.feature_name,
                CustomerFeatureRecord.feature_value,
                CustomerFeatureRecord.recorded_at
            )
            .filter(CustomerFeatureRecord.customer_id == customer_id)
            .distinct(CustomerFeatureRecord.feature_name)
            .order_by(
                CustomerFeatureRecord.feature_name,
                CustomerFeatureRecord.recorded_at.desc()
            )
            .subquery()
        )
        
        # Execute the query and build the feature dictionary
        for row in db.query(subquery).all():
            features[row.feature_name] = row.feature_value
        
        return features
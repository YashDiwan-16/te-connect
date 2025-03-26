from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.database import Base

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(String, index=True, nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
    
    # Relationships
    predictions = relationship("RiskPredictionRecord", back_populates="customer")
    mitigations = relationship("MitigationRecord", back_populates="customer")
    
    def __repr__(self):
        return f"<Customer {self.name}>"

class CustomerFeatureRecord(Base):
    __tablename__ = "customer_features"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    feature_name = Column(String, nullable=False)
    feature_value = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer")
    
    def __repr__(self):
        return f"<CustomerFeature {self.feature_name}={self.feature_value}>"

class RiskPredictionRecord(Base):
    __tablename__ = "risk_predictions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    risk_level = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=True)
    prediction_timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="predictions")
    
    def __repr__(self):
        return f"<RiskPrediction {self.customer_id}: {self.risk_level}>"

class MitigationRecord(Base):
    __tablename__ = "mitigations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    risk_level = Column(String, nullable=False)
    mitigation_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    assigned_to = Column(String, nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
    status = Column(
        String,
        default="Pending",
        nullable=False
    )
    
    # Relationships
    customer = relationship("Customer", back_populates="mitigations")
    
    def __repr__(self):
        return f"<Mitigation {self.mitigation_type} for {self.customer_id}>"
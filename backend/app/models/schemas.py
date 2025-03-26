from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Any
from datetime import datetime
from uuid import UUID, uuid4

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    
class CustomerCreate(CustomerBase):
    external_id: Optional[str] = None
    
class CustomerFeatures(BaseModel):
    age: Optional[int] = None
    income: Optional[float] = None
    credit_score: Optional[int] = None
    account_balance: Optional[float] = None
    num_transactions: Optional[int] = None
    transaction_frequency: Optional[float] = None
    average_transaction_amount: Optional[float] = None
    
    class Config:
        extra = "allow"  # Allow additional fields
        
class CustomerWithFeatures(CustomerBase):
    id: UUID
    external_id: Optional[str] = None
    features: CustomerFeatures
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Risk Prediction Schemas
class RiskPredictionCreate(BaseModel):
    customer_id: UUID
    customer_features: CustomerFeatures
    
class RiskPrediction(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    risk_level: str  # "Low", "Medium", or "High"
    confidence_score: Optional[float] = None
    prediction_timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        orm_mode = True
        
    @validator('risk_level')
    def validate_risk_level(cls, v):
        allowed_values = ["Low", "Medium", "High"]
        if v not in allowed_values:
            raise ValueError(f"risk_level must be one of {allowed_values}")
        return v

# Mitigation Schemas
class MitigationCreate(BaseModel):
    customer_id: UUID
    risk_level: str  # Should be "High" for mitigations
    mitigation_type: str  # "Flag", "Note", "Action", "Monitor", etc.
    description: str
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    
    @validator('risk_level')
    def validate_high_risk(cls, v):
        if v != "High":
            raise ValueError("Mitigations can only be applied to high-risk customers")
        return v
    
    @validator('mitigation_type')
    def validate_mitigation_type(cls, v):
        allowed_types = ["Flag", "Note", "Action", "Monitor"]
        if v not in allowed_types:
            raise ValueError(f"mitigation_type must be one of {allowed_types}")
        return v
        
class Mitigation(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    risk_level: str
    mitigation_type: str
    description: str
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    status: str = "Pending"  # "Pending", "In Progress", "Completed", "Cancelled"
    
    class Config:
        orm_mode = True

# Statistics Schema
class RiskDistribution(BaseModel):
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    total_customers: int
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('total_customers')
    def validate_total(cls, v, values):
        expected_total = sum([
            values.get('low_risk_count', 0),
            values.get('medium_risk_count', 0),
            values.get('high_risk_count', 0)
        ])
        
        if v != expected_total:
            raise ValueError(f"total_customers must equal sum of risk counts ({expected_total})")
        return v
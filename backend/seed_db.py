from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Customer, CustomerFeatureRecord, RiskPredictionRecord
from app.models.ml_model import risk_model
import random
from datetime import datetime, timedelta

# Sample data
customer_names = [
    "John Smith", "Emily Johnson", "Michael Williams", "Sarah Brown", 
    "David Jones", "Jessica Miller", "Christopher Davis", "Ashley Wilson",
    "Matthew Taylor", "Amanda Anderson", "James Thomas", "Jennifer Jackson",
    "Robert White", "Elizabeth Harris", "Daniel Martinez", "Stephanie Thompson",
    "Joseph Garcia", "Nicole Robinson", "William Clark", "Megan Lewis"
]

def generate_features():
    """Generate random features for a customer"""
    return {
        "age": random.randint(18, 80),
        "income": round(random.uniform(20000, 150000), 2),
        "credit_score": random.randint(300, 850),
        "account_balance": round(random.uniform(0, 50000), 2),
        "num_transactions": random.randint(1, 200),
        "transaction_frequency": round(random.uniform(0.5, 30), 2),
        "average_transaction_amount": round(random.uniform(10, 1000), 2)
    }

def seed_database():
    """Seed the database with sample data"""
    db = next(get_db())
    
    # Create customers
    customers = []
    for i, name in enumerate(customer_names):
        customer = Customer(
            name=name,
            email=f"{name.lower().replace(' ', '.')}@example.com",
            external_id=f"CUST-{1000 + i}",
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 365))
        )
        db.add(customer)
        customers.append(customer)
    
    db.commit()
    
    # Add features and risk predictions
    for customer in customers:
        # Generate features
        features = generate_features()
        
        # Store features
        for feature_name, feature_value in features.items():
            feature_record = CustomerFeatureRecord(
                customer_id=customer.id,
                feature_name=feature_name,
                feature_value=feature_value
            )
            db.add(feature_record)
        
        # Make risk prediction
        prediction_result = risk_model.predict(features)
        
        # Store prediction
        prediction = RiskPredictionRecord(
            customer_id=customer.id,
            risk_level=prediction_result["risk_level"],
            confidence_score=prediction_result.get("confidence_score", random.uniform(0.7, 0.95)),
            prediction_timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 30))
        )
        db.add(prediction)
    
    db.commit()
    print(f"Database seeded with {len(customers)} customers, their features, and risk predictions")

if __name__ == "__main__":
    seed_database()
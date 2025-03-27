#!/usr/bin/env python3
"""
Bulk Data Generation Script for Customer Risk Prediction Dashboard

This script generates random customer data and posts it to the backend API.
It creates customers, adds their features, predicts their risk level, and
creates mitigations for high-risk customers.
"""

import requests
import random
import json
import time
from datetime import datetime, timedelta
import argparse
from typing import Dict, List, Any

# API endpoint base URL
BASE_URL = "http://localhost:8000/api"

# Customer name generation data
FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", 
    "William", "Elizabeth", "David", "Susan", "Richard", "Jessica", "Joseph", "Sarah", 
    "Thomas", "Karen", "Charles", "Nancy", "Christopher", "Lisa", "Daniel", "Betty", 
    "Matthew", "Margaret", "Anthony", "Sandra", "Mark", "Ashley", "Donald", "Kimberly",
    "Emma", "Noah", "Olivia", "Liam", "Ava", "William", "Sophia", "Mason", "Isabella",
    "Ethan", "Charlotte", "Michael", "Mia", "Alexander", "Amelia", "Harper", "Evelyn"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", 
    "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin",
    "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee",
    "Walker", "Hall", "Allen", "Young", "King", "Wright", "Scott", "Green", "Baker",
    "Adams", "Nelson", "Hill", "Ramirez", "Campbell", "Mitchell", "Roberts", "Carter",
    "Phillips", "Evans", "Turner", "Torres", "Parker", "Collins", "Edwards", "Stewart"
]

# Risk factor ranges
RISK_FACTORS = {
    "age": {"low": (35, 65), "medium": (25, 34), "high": (18, 24)},
    "income": {"low": (80000, 200000), "medium": (40000, 79999), "high": (20000, 39999)},
    "credit_score": {"low": (720, 850), "medium": (620, 719), "high": (300, 619)},
    "account_balance": {"low": (10000, 100000), "medium": (2000, 9999), "high": (0, 1999)},
    "num_transactions": {"low": (5, 50), "medium": (51, 150), "high": (151, 300)},
    "transaction_frequency": {"low": (1, 10), "medium": (11, 20), "high": (21, 30)},
    "average_transaction_amount": {"low": (10, 200), "medium": (201, 500), "high": (501, 1000)}
}

def generate_random_name() -> str:
    """Generate a random full name."""
    first_name = random.choice(FIRST_NAMES)
    last_name = random.choice(LAST_NAMES)
    return f"{first_name} {last_name}"

def generate_email(name: str) -> str:
    """Generate an email address from a name."""
    name_parts = name.lower().split()
    domains = ["example.com", "testmail.com", "company.net", "business.org"]
    if random.random() < 0.5:
        username = f"{name_parts[0]}.{name_parts[1]}"
    else:
        username = f"{name_parts[0][0]}{name_parts[1]}"
    
    return f"{username}@{random.choice(domains)}"

def generate_phone() -> str:
    """Generate a random phone number."""
    area_code = random.randint(200, 999)
    prefix = random.randint(200, 999)
    line = random.randint(1000, 9999)
    return f"+1-{area_code}-{prefix}-{line}"

def generate_customer() -> Dict[str, Any]:
    """Generate a random customer profile."""
    name = generate_random_name()
    return {
        "name": name,
        "email": generate_email(name),
        "phone": generate_phone(),
        "external_id": f"CUST-{random.randint(1000, 9999)}"
    }

def generate_features(risk_profile: str) -> Dict[str, Any]:
    """
    Generate customer features based on risk profile.
    
    Args:
        risk_profile: "low", "medium", or "high" risk profile to generate features for
    """
    features = {}
    for factor, ranges in RISK_FACTORS.items():
        min_val, max_val = ranges[risk_profile]
        
        # Generate a value within the range
        if factor in ["age", "num_transactions", "credit_score"]:
            # Integer features
            features[factor] = random.randint(min_val, max_val)
        else:
            # Float features with 2 decimal places
            features[factor] = round(random.uniform(min_val, max_val), 2)
    
    return features

def create_customer(customer_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a customer via API call."""
    response = requests.post(f"{BASE_URL}/customers/", json=customer_data)
    if response.status_code != 200:
        print(f"Error creating customer: {response.text}")
        return None
    return response.json()

def add_features_and_predict(customer_id: str, features_data: Dict[str, Any]) -> Dict[str, Any]:
    """Add features to a customer and get a risk prediction."""
    prediction_data = {
        "customer_id": customer_id,
        "customer_features": features_data
    }
    
    response = requests.post(f"{BASE_URL}/predictions/predict", json=prediction_data)
    if response.status_code != 200:
        print(f"Error predicting risk: {response.text}")
        return None
    return response.json()

def create_mitigation(customer_id: str) -> Dict[str, Any]:
    """Create a mitigation measure for a high-risk customer."""
    mitigation_types = ["Flag", "Note", "Action", "Monitor"]
    descriptions = [
        "Customer shows high-risk transaction patterns. Manual review required.",
        "Multiple large transactions detected. Possible fraud risk.",
        "Irregular account activity detected. Schedule customer verification call.",
        "Low account balance with high transaction frequency. Monitor for overdrafts.",
        "Recent credit score decrease. Schedule financial advisory session."
    ]
    
    assignees = ["Risk Team", "Account Manager", "Fraud Department", "Customer Service", "Financial Advisor"]
    
    # Random due date in the next 30 days
    due_date = (datetime.now() + timedelta(days=random.randint(1, 30))).isoformat()
    
    mitigation_data = {
        "customer_id": customer_id,
        "risk_level": "High",
        "mitigation_type": random.choice(mitigation_types),
        "description": random.choice(descriptions),
        "assigned_to": random.choice(assignees),
        "due_date": due_date
    }
    
    response = requests.post(f"{BASE_URL}/mitigations/", json=mitigation_data)
    if response.status_code != 200:
        print(f"Error creating mitigation: {response.text}")
        return None
    return response.json()

def main():
    """Main function to generate and post data."""
    parser = argparse.ArgumentParser(description="Generate and post bulk data to Customer Risk Dashboard API")
    parser.add_argument("--count", type=int, default=20, help="Number of customers to generate (default: 20)")
    parser.add_argument("--risk-distribution", type=str, default="40,40,20", 
                        help="Percentage distribution of low,medium,high risk customers (default: 40,40,20)")
    args = parser.parse_args()
    
    # Parse risk distribution
    try:
        low_pct, medium_pct, high_pct = map(int, args.risk_distribution.split(','))
        if low_pct + medium_pct + high_pct != 100:
            raise ValueError("Risk distribution percentages must sum to 100")
    except ValueError:
        print("Invalid risk distribution format. Using default 40,40,20.")
        low_pct, medium_pct, high_pct = 40, 40, 20
    
    # Calculate counts for each risk category
    total_count = args.count
    low_count = round(total_count * low_pct / 100)
    medium_count = round(total_count * medium_pct / 100)
    high_count = total_count - low_count - medium_count
    
    print(f"Generating {total_count} customers with risk distribution: {low_count} low, {medium_count} medium, {high_count} high")
    
    # Generate and post customers
    customer_count = {
        "low": low_count,
        "medium": medium_count,
        "high": high_count
    }
    
    mitigations_created = 0
    high_risk_customers = []
    
    for risk_level, count in customer_count.items():
        print(f"\nGenerating {count} {risk_level}-risk customers...")
        
        for i in range(count):
            customer_data = generate_customer()
            print(f"Creating customer {i+1}/{count}: {customer_data['name']}...")
            
            # Create customer
            created_customer = create_customer(customer_data)
            if not created_customer:
                continue
            
            customer_id = created_customer["id"]
            
            # Generate features based on risk profile
            features = generate_features(risk_level)
            print(f"Adding features and predicting risk...")
            
            # Add features and get prediction
            prediction = add_features_and_predict(customer_id, features)
            if not prediction:
                continue
            
            print(f"Risk prediction: {prediction['risk_level']} with confidence {prediction.get('confidence_score', 'N/A')}")
            
            # Track high-risk customers for mitigation
            if prediction['risk_level'] == "High":
                high_risk_customers.append(customer_id)
            
            # Add a small delay to prevent overwhelming the API
            time.sleep(0.2)
    
    # Create mitigations for high-risk customers
    if high_risk_customers:
        print(f"\nCreating mitigation measures for {len(high_risk_customers)} high-risk customers...")
        
        for i, customer_id in enumerate(high_risk_customers):
            print(f"Creating mitigation {i+1}/{len(high_risk_customers)}...")
            mitigation = create_mitigation(customer_id)
            if mitigation:
                mitigations_created += 1
            
            # Add a small delay
            time.sleep(0.2)
    
    # Print summary
    print("\n======== Data Generation Summary ========")
    print(f"Total customers created: {low_count + medium_count + high_count}")
    print(f"  - Low-risk customers: {low_count}")
    print(f"  - Medium-risk customers: {medium_count}")
    print(f"  - High-risk customers: {high_count}")
    print(f"Mitigations created: {mitigations_created}")
    print("========================================")

if __name__ == "__main__":
    main()
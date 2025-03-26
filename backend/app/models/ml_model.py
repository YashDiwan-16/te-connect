import pickle
import os
import numpy as np
from typing import Dict, Any, List, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class RiskModel:
    def __init__(self):
        self.model = None
        self.features = None
        self._load_model()
    
    def _load_model(self) -> None:
        """Loads the pickled ML model."""
        try:
            with open(settings.MODEL_PATH, 'rb') as f:
                model_data = pickle.load(f)
                
                # Depending on how the model was saved, you might need to adjust this
                # If the pickle contains just the model
                if hasattr(model_data, 'predict'):
                    self.model = model_data
                # If the pickle contains both model and feature names
                elif isinstance(model_data, dict) and 'model' in model_data:
                    self.model = model_data['model']
                    self.features = model_data.get('features')
                else:
                    self.model = model_data
                    
            logger.info(f"Successfully loaded risk prediction model from {settings.MODEL_PATH}")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise RuntimeError(f"Failed to load risk prediction model: {str(e)}")
    
    def predict(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict risk level for a customer based on their data.
        
        Args:
            customer_data: Dictionary containing customer features
            
        Returns:
            Dictionary with risk level and confidence score
        """
        try:
            if self.model is None:
                self._load_model()
                
            # Transform customer data into feature array
            features_array = self._preprocess_features(customer_data)
            
            # Make prediction
            prediction_result = self.model.predict(features_array)[0]
            
            # Get prediction probabilities if available
            confidence_score = None
            if hasattr(self.model, 'predict_proba'):
                probabilities = self.model.predict_proba(features_array)[0]
                confidence_score = float(max(probabilities))
            
            # Map prediction to risk level
            risk_levels = {0: "Low", 1: "Medium", 2: "High"}
            risk_level = risk_levels.get(prediction_result, "Unknown")
            
            return {
                "risk_level": risk_level,
                "confidence_score": confidence_score,
                "prediction": int(prediction_result)
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            raise ValueError(f"Failed to generate prediction: {str(e)}")
    
    def _preprocess_features(self, customer_data: Dict[str, Any]) -> np.ndarray:
        """
        Preprocess customer data into feature array for model input.
        
        Args:
            customer_data: Raw customer data
            
        Returns:
            NumPy array of features in the format expected by the model
        """
        # Extract required features in the correct order
        # This will need to be customized based on your model's expected input
        
        if self.features:
            # If we have feature names, use them to order the features
            feature_values = []
            for feature in self.features:
                if feature in customer_data:
                    feature_values.append(customer_data[feature])
                else:
                    # Handle missing features
                    logger.warning(f"Missing feature: {feature}")
                    feature_values.append(0)  # Default value or imputation
            
            return np.array([feature_values])
        else:
            # If we don't have feature names, make assumptions based on the data
            # This is just an example and should be adapted to your specific model
            feature_keys = [
                "age", "income", "credit_score", "account_balance",
                "num_transactions", "transaction_frequency", "average_transaction_amount"
            ]
            
            feature_values = []
            for key in feature_keys:
                if key in customer_data:
                    feature_values.append(customer_data[key])
                else:
                    feature_values.append(0)  # Default value
            
            return np.array([feature_values])

# Create a singleton instance
risk_model = RiskModel()
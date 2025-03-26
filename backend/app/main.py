from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import customers, predictions, mitigations
from app.core.config import settings

app = FastAPI(
    title="Customer Risk Prediction API",
    description="API for predicting and managing customer risk levels",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(mitigations.router, prefix="/api/mitigations", tags=["mitigations"])

@app.get("/", tags=["health"])
async def health_check():
    return {"status": "ok", "message": "Customer Risk Prediction API is running"}
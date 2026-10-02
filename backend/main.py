from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from config import settings
from routes import profile, food, labs, dashboard, ai, history

app = FastAPI(
    title="AI Nutrition Intelligence Platform API",
    description="Backend engine for longitudinal nutrition tracking, lab report extraction, and context-aware nutrition intelligence.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Next.js frontend running locally
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global custom exception handler for friendly, readable messages
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled server error at {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred while processing your request. Please verify your connection or try again."
        }
    )

# Include routes
app.include_router(profile.router)
app.include_router(food.router)
app.include_router(labs.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(history.router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Nutrition Intelligence Backend",
        "usda_configured": bool(settings.USDA_API_KEY),
        "groq_configured": bool(settings.GROQ_API_KEY),
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY)
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)

from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from config import settings

security = HTTPBearer(auto_error=False)

# Admin or general client
_supabase_admin: Optional[Client] = None

def get_supabase_admin() -> Optional[Client]:
    global _supabase_admin
    if _supabase_admin is not None:
        return _supabase_admin
    
    if settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY):
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        try:
            _supabase_admin = create_client(settings.SUPABASE_URL, key)
            return _supabase_admin
        except Exception as e:
            print(f"Warning: Failed to initialize Supabase client: {e}")
            return None
    return None

def get_supabase_client(token: Optional[str] = None) -> Optional[Client]:
    """Returns a client scoped with user token or anon key"""
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return None
    try:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        if token:
            client.postgrest.auth(token)
        return client
    except Exception as e:
        print(f"Error creating Supabase client: {e}")
        return None

async def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """Extracts and validates Supabase user ID from Bearer token"""
    if not credentials or not credentials.credentials:
        # Check if running in development mode without active auth token
        raise HTTPException(status_code=401, detail="Authentication token required. Please sign in.")
    
    token = credentials.credentials
    admin_client = get_supabase_admin()
    if not admin_client:
        raise HTTPException(status_code=500, detail="Database connection not configured. Check environment variables.")
    
    try:
        user_response = admin_client.auth.get_user(token)
        if user_response and user_response.user:
            return str(user_response.user.id)
        raise HTTPException(status_code=401, detail="Invalid authentication token.")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from dotenv import load_dotenv
import os
import logging

load_dotenv()
logger = logging.getLogger("cortex-auth")

router = APIRouter(prefix="/auth", tags=["auth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = ["localhost:3000", "localhost:3001", ".vercel.app"]

class UpdateProfileRequest(BaseModel):
    name: str
    vibe: str
    emotional_baseline: str

# ── Configure OAuth ──
oauth = OAuth()

# Google
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# GitHub
oauth.register(
    name="github",
    client_id=os.getenv("GITHUB_CLIENT_ID"),
    client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
    access_token_url="https://github.com/login/oauth/access_token",
    access_token_params=None,
    authorize_url="https://github.com/login/oauth/authorize",
    authorize_params=None,
    api_base_url="https://api.github.com/",
    client_kwargs={"scope": "user:email"},
)


@router.get("/login/{provider}")
async def login(provider: str, request: Request):
    """Redirect user to OAuth provider's login page."""
    redirect_uri = request.url_for("auth_callback", provider=provider)
    
    # Capture frontend URL from Referer header if available
    referer = request.headers.get("referer")
    if referer:
        from urllib.parse import urlparse
        parsed = urlparse(referer)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        # Accept localhost and any vercel.app domain
        if any(allowed in parsed.netloc for allowed in ALLOWED_ORIGINS):
            request.session["frontend_url"] = origin

    logger.info(f"OAuth login: provider={provider}, redirect_uri={redirect_uri}")
    
    if provider == "google":
        return await oauth.google.authorize_redirect(request, redirect_uri)
    elif provider == "github":
        return await oauth.github.authorize_redirect(request, redirect_uri)
    
    raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")


@router.get("/callback/{provider}", name="auth_callback")
async def auth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    """Handle the OAuth callback, create/find user, redirect to frontend."""
    try:
        if provider == "google":
            token = await oauth.google.authorize_access_token(request)
            user_info = token.get("userinfo", {})
            email = user_info.get("email")
            name = user_info.get("name")
            picture = user_info.get("picture")

        elif provider == "github":
            token = await oauth.github.authorize_access_token(request)
            # Get user profile
            resp = await oauth.github.get("user", token=token)
            gh_user = resp.json()
            name = gh_user.get("name") or gh_user.get("login")
            picture = gh_user.get("avatar_url")
            email = gh_user.get("email")
            
            # GitHub may hide email — fetch from /user/emails
            if not email:
                email_resp = await oauth.github.get("user/emails", token=token)
                emails = email_resp.json()
                if isinstance(emails, list) and len(emails) > 0:
                    # Prefer primary email
                    primary = next((e for e in emails if e.get("primary")), emails[0])
                    email = primary.get("email")
        else:
            raise HTTPException(status_code=400, detail="Unknown provider")

        if not email:
            logger.error(f"No email returned from {provider}")
            return RedirectResponse(url=f"{FRONTEND_URL}?error=no_email")

        # Find or create user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, name=name or "User", picture=picture)
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Created new user: {email}")
        else:
            # Update name/picture if changed
            if name and user.name != name:
                user.name = name
            if picture and user.picture != picture:
                user.picture = picture
            db.commit()
            logger.info(f"Existing user logged in: {email}")

        # Store in session
        request.session["user_id"] = user.id

        # Redirect back to frontend
        return_url = request.session.pop("frontend_url", FRONTEND_URL)
        return RedirectResponse(url=return_url)

    except Exception as e:
        logger.error(f"OAuth callback error: {e}", exc_info=True)
        return_url = request.session.pop("frontend_url", FRONTEND_URL) if "frontend_url" in request.session else FRONTEND_URL
        return RedirectResponse(url=f"{return_url}?error=auth_failed")


@router.get("/me")
async def get_me(request: Request, db: Session = Depends(get_db)):
    """Return the currently logged-in user, or null."""
    user_id = request.session.get("user_id")
    if not user_id:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "vibe": user.vibe,
        "emotional_baseline": user.emotional_baseline,
    }


@router.get("/logout")
async def logout(request: Request):
    request.session.pop("user_id", None)
    return {"message": "Logged out"}


@router.post("/update_profile")
async def update_profile(req: UpdateProfileRequest, request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.name = req.name
    user.vibe = req.vibe
    user.emotional_baseline = req.emotional_baseline
    db.commit()
    return {"name": user.name, "vibe": user.vibe, "emotional_baseline": user.emotional_baseline}

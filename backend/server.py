from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import shutil
import uuid as uuid_lib
from functools import lru_cache
import httpx

from models import (
    ContactSubmission,
    ContactSubmissionCreate,
    ContactSubmissionResponse,
    AdminLogin,
    AdminLoginResponse,
    SupportTicket,
    SupportTicketCreate,
    TicketReplyCreate,
    TicketReply,
    SystemSettings,
    SettingsUpdate,
    EmailSettings,
    SEOSettings,
    PageContent,
    ContentUpdate
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    verify_token
)
from email_service import EmailService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / 'static' / 'uploads'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Add GZip compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Mount static files directory with caching
app.mount("/static", StaticFiles(directory=str(ROOT_DIR / "static")), name="static")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cache for frequently accessed data
_branding_cache = None
_branding_cache_time = None
_seo_cache = None
_seo_cache_time = None
CACHE_DURATION = 300  # 5 minutes

async def get_cached_branding():
    """Get branding with caching"""
    global _branding_cache, _branding_cache_time
    
    now = datetime.utcnow()
    if _branding_cache and _branding_cache_time:
        if (now - _branding_cache_time).total_seconds() < CACHE_DURATION:
            return _branding_cache
    
    settings = await db.settings.find_one()
    if settings and settings.get('branding'):
        _branding_cache = settings['branding']
    else:
        _branding_cache = {
            "logo_url": "https://customer-assets.emergentagent.com/job_a08c0b50-0e68-4792-b6a6-4a15ac002d5c/artifacts/3mcpq5px_Logo.jpeg",
            "favicon_url": "",
            "company_name": "IXA Digital"
        }
    _branding_cache_time = now
    return _branding_cache

async def get_cached_seo():
    """Get SEO config with caching"""
    global _seo_cache, _seo_cache_time
    
    now = datetime.utcnow()
    if _seo_cache and _seo_cache_time:
        if (now - _seo_cache_time).total_seconds() < CACHE_DURATION:
            return _seo_cache
    
    settings = await db.settings.find_one()
    if settings and settings.get('seo_settings'):
        _seo_cache = settings['seo_settings']
    else:
        from models import SEOSettings
        _seo_cache = SEOSettings().dict()
    _seo_cache_time = now
    return _seo_cache

async def verify_recaptcha(token: str) -> bool:
    """Verify Google reCAPTCHA token"""
    try:
        settings = await db.settings.find_one()
        if not settings or not settings.get('recaptcha_settings'):
            return True  # If not configured, allow submission
        
        recaptcha = settings['recaptcha_settings']
        if not recaptcha.get('enabled'):
            return True  # If disabled, allow submission
        
        secret_key = recaptcha.get('secret_key')
        if not secret_key:
            return True
        
        # Verify with Google
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://www.google.com/recaptcha/api/siteverify',
                data={
                    'secret': secret_key,
                    'response': token
                },
                timeout=5.0
            )
            result = response.json()
            return result.get('success', False)
    except Exception as e:
        logger.error(f"reCAPTCHA verification error: {str(e)}")
        return True  # On error, allow submission (fail open)

def clear_cache():
    """Clear all caches"""
    global _branding_cache, _branding_cache_time, _seo_cache, _seo_cache_time
    _branding_cache = None
    _branding_cache_time = None
    _seo_cache = None
    _seo_cache_time = None

# Helper function to get email service
async def get_email_service():
    settings = await db.settings.find_one()
    if settings and settings.get('email_settings'):
        return EmailService(settings['email_settings'])
    return EmailService({'enabled': False})

# Dependency to verify admin token
async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    admin = await db.admins.find_one({"username": payload.get("sub")})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    
    return admin

# Initialize default admin and settings
async def init_defaults():
    """Create default admin user and settings if not exists"""
    # Create admin
    existing_admin = await db.admins.find_one({"username": "admin"})
    if not existing_admin:
        admin_data = {
            "username": "admin",
            "password_hash": get_password_hash("IXADigital@2026"),
            "created_at": datetime.utcnow()
        }
        await db.admins.insert_one(admin_data)
        logger.info("Default admin user created")
    
    # Create default settings
    existing_settings = await db.settings.find_one()
    if not existing_settings:
        default_settings = SystemSettings()
        await db.settings.insert_one(default_settings.dict())
        logger.info("Default settings created")
    
    # Create default homepage content
    existing_content = await db.page_content.find_one({"page": "homepage"})
    if not existing_content:
        from models import PageContent, HeroContent, AboutContent, FooterContent
        default_content = PageContent(
            page="homepage",
            hero=HeroContent(),
            about=AboutContent(),
            footer=FooterContent(),
            cta_section={
                "headline": "Let's Build Your Digital Growth Engine",
                "description": "Ready to scale your business with data-driven strategies and cutting-edge solutions?",
                "button_text": "Start Your Project"
            }
        )
        await db.page_content.insert_one(default_content.dict())
        logger.info("Default homepage content created")

# Generate ticket number
async def generate_ticket_number():
    count = await db.support_tickets.count_documents({})
    return f"TKT-{str(count + 1).zfill(6)}"

# Public Routes
@api_router.get("/")
async def root():
    return {"message": "IXA Digital API"}

@api_router.get("/seo-config")
async def get_seo_config():
    """Get SEO configuration for frontend"""
    settings = await db.settings.find_one()
    if settings and settings.get('seo_settings'):
        return settings['seo_settings']
    return SEOSettings().dict()

@api_router.post("/track-ticket")
async def track_ticket(ticket_number: str, customer_email: str):
    """Track a support ticket (public with verification)"""
    try:
        ticket = await db.support_tickets.find_one({
            "ticket_number": ticket_number,
            "customer_email": customer_email
        })
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found or email doesn't match")
        
        ticket["_id"] = str(ticket["_id"])
        return {
            "success": True,
            "ticket": ticket
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error tracking ticket: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to track ticket")

@api_router.post("/ticket/{ticket_id}/customer-reply")
async def customer_reply_to_ticket(
    ticket_id: str,
    reply_message: str,
    customer_email: str
):
    """Customer reply to their own ticket (public with verification)"""
    try:
        ticket = await db.support_tickets.find_one({
            "id": ticket_id,
            "customer_email": customer_email
        })
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found or email doesn't match")
        
        # Check if ticket is closed
        if ticket.get("status") == "closed":
            raise HTTPException(status_code=400, detail="Cannot reply to a closed ticket")
        
        reply = TicketReply(
            author=ticket["customer_name"],
            message=reply_message,
            is_admin=False
        )
        
        result = await db.support_tickets.update_one(
            {"id": ticket_id},
            {
                "$push": {"replies": reply.dict()},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to add reply")
        
        # Send email notification to admin
        email_service = await get_email_service()
        settings = await db.settings.find_one()
        if settings and settings.get('email_settings', {}).get('enabled'):
            recipients = settings['email_settings'].get('notification_recipients', [])
            if recipients:
                # Notify admin about customer reply
                subject = f"Customer Reply: Ticket #{ticket['ticket_number']}"
                html_body = f"""
                <h2>Customer Reply on Ticket #{ticket['ticket_number']}</h2>
                <p><strong>From:</strong> {ticket['customer_name']} ({customer_email})</p>
                <p><strong>Subject:</strong> {ticket['subject']}</p>
                <p><strong>Reply:</strong></p>
                <p>{reply_message}</p>
                <p><a href="/admin/tickets">View in Admin Panel</a></p>
                """
                email_service.send_email(recipients, subject, html_body)
        
        return {"success": True, "message": "Reply added successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error adding customer reply: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add reply")

@api_router.get("/recaptcha-config")
async def get_recaptcha_config(response: Response):
    """Get reCAPTCHA site key (public) with caching"""
    try:
        response.headers["Cache-Control"] = "public, max-age=300"
        
        settings = await db.settings.find_one()
        if settings and settings.get('recaptcha_settings'):
            recaptcha = settings['recaptcha_settings']
            return {
                "success": True,
                "enabled": recaptcha.get('enabled', False),
                "site_key": recaptcha.get('site_key', '')
            }
        return {"success": True, "enabled": False, "site_key": ""}
    except Exception as e:
        logger.error(f"Error fetching reCAPTCHA config: {str(e)}")
        return {"success": True, "enabled": False, "site_key": ""}

@api_router.get("/branding")
async def get_branding():
    """Get branding configuration (logo, favicon) - public"""
    try:
        settings = await db.settings.find_one()
        if settings and settings.get('branding'):
            return {"success": True, "branding": settings['branding']}
        return {
            "success": True,
            "branding": {
                "logo_url": "https://customer-assets.emergentagent.com/job_a08c0b50-0e68-4792-b6a6-4a15ac002d5c/artifacts/3mcpq5px_Logo.jpeg",
                "favicon_url": "",
                "company_name": "IXA Digital"
            }
        }
    except Exception as e:
        logger.error(f"Error fetching branding: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch branding")

@api_router.get("/page-content/{page}")
async def get_page_content(page: str, response: Response):
    """Get page content (public) with caching"""
    try:
        # Set cache headers
        response.headers["Cache-Control"] = "public, max-age=300"  # 5 minutes
        
        content = await db.page_content.find_one({"page": page})
        if not content:
            return {"success": False, "message": "Content not found"}
        
        content["_id"] = str(content["_id"])
        return {"success": True, "content": content}
    except Exception as e:
        logger.error(f"Error fetching page content: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch content")

@api_router.post("/contact", response_model=ContactSubmissionResponse)
async def submit_contact_form(submission: ContactSubmissionCreate, recaptcha_token: Optional[str] = None):
    """Submit a contact form"""
    try:
        # Verify reCAPTCHA
        if not await verify_recaptcha(recaptcha_token):
            raise HTTPException(status_code=400, detail="reCAPTCHA verification failed. Please try again.")
        
        contact_data = ContactSubmission(**submission.dict())
        await db.contact_submissions.insert_one(contact_data.dict())
        
        logger.info(f"New contact submission from {submission.email}")
        
        # Send email notification
        email_service = await get_email_service()
        settings = await db.settings.find_one()
        if settings and settings.get('email_settings', {}).get('enabled'):
            recipients = settings['email_settings'].get('notification_recipients', [])
            if recipients:
                email_service.send_new_inquiry_notification(contact_data.dict(), recipients)
        
        return ContactSubmissionResponse(
            success=True,
            message="Thank you for your inquiry! We'll get back to you within 24 hours.",
            id=contact_data.id
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error submitting contact form: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit form")

@api_router.post("/support-ticket")
async def create_support_ticket(ticket_data: SupportTicketCreate, recaptcha_token: Optional[str] = None):
    """Create a new support ticket (public)"""
    try:
        # Verify reCAPTCHA
        if not await verify_recaptcha(recaptcha_token):
            raise HTTPException(status_code=400, detail="reCAPTCHA verification failed. Please try again.")
        
        ticket_number = await generate_ticket_number()
        ticket = SupportTicket(
            **ticket_data.dict(),
            ticket_number=ticket_number
        )
        await db.support_tickets.insert_one(ticket.dict())
        
        logger.info(f"New support ticket created: {ticket_number}")
        
        # Send email notification
        email_service = await get_email_service()
        settings = await db.settings.find_one()
        if settings and settings.get('email_settings', {}).get('enabled'):
            recipients = settings['email_settings'].get('notification_recipients', [])
            if recipients:
                email_service.send_ticket_notification(ticket.dict(), recipients)
        
        return {
            "success": True,
            "message": "Support ticket created successfully",
            "ticket_number": ticket_number,
            "ticket_id": ticket.id
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error creating support ticket: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create ticket")

# Sitemap endpoint
@api_router.get("/sitemap.xml", response_class=PlainTextResponse)
async def get_sitemap():
    """Generate sitemap.xml"""
    base_url = os.getenv("FRONTEND_URL", "https://your-domain.com")
    
    sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>{base_url}/</loc>
        <lastmod>{datetime.utcnow().strftime('%Y-%m-%d')}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>{base_url}/admin/login</loc>
        <lastmod>{datetime.utcnow().strftime('%Y-%m-%d')}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.3</priority>
    </url>
</urlset>"""
    
    return sitemap

# Admin Authentication Routes
@api_router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(credentials: AdminLogin):
    """Admin login endpoint"""
    admin = await db.admins.find_one({"username": credentials.username})
    
    if not admin or not verify_password(credentials.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    access_token = create_access_token(data={"sub": admin["username"]})
    
    return AdminLoginResponse(
        success=True,
        message="Login successful",
        token=access_token,
        admin={
            "username": admin["username"],
            "id": admin.get("id", str(admin["_id"]))
        }
    )

# Admin Protected Routes - Contact Submissions
@api_router.get("/admin/submissions")
async def get_all_submissions(
    status: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Get all contact submissions (Admin only)"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        submissions = await db.contact_submissions.find(query).sort("created_at", -1).to_list(1000)
        
        for submission in submissions:
            submission["_id"] = str(submission["_id"])
        
        return {
            "success": True,
            "count": len(submissions),
            "submissions": submissions
        }
    except Exception as e:
        logger.error(f"Error fetching submissions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch submissions")

@api_router.patch("/admin/submissions/{submission_id}/status")
async def update_submission_status(
    submission_id: str,
    status: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Update submission status (Admin only)"""
    try:
        result = await db.contact_submissions.update_one(
            {"id": submission_id},
            {"$set": {"status": status}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        return {"success": True, "message": "Status updated successfully"}
    except Exception as e:
        logger.error(f"Error updating submission status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update status")

@api_router.delete("/admin/submissions/{submission_id}")
async def delete_submission(
    submission_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Delete a submission (Admin only)"""
    try:
        result = await db.contact_submissions.delete_one({"id": submission_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        return {"success": True, "message": "Submission deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting submission: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete submission")

@api_router.get("/admin/stats")
async def get_admin_stats(current_admin: dict = Depends(get_current_admin)):
    """Get admin dashboard statistics"""
    try:
        # Contact submissions stats
        total_submissions = await db.contact_submissions.count_documents({})
        new_submissions = await db.contact_submissions.count_documents({"status": "new"})
        read_submissions = await db.contact_submissions.count_documents({"status": "read"})
        contacted_submissions = await db.contact_submissions.count_documents({"status": "contacted"})
        
        # Support tickets stats
        total_tickets = await db.support_tickets.count_documents({})
        open_tickets = await db.support_tickets.count_documents({"status": "open"})
        in_progress_tickets = await db.support_tickets.count_documents({"status": "in_progress"})
        resolved_tickets = await db.support_tickets.count_documents({"status": "resolved"})
        
        return {
            "success": True,
            "stats": {
                "submissions": {
                    "total": total_submissions,
                    "new": new_submissions,
                    "read": read_submissions,
                    "contacted": contacted_submissions
                },
                "tickets": {
                    "total": total_tickets,
                    "open": open_tickets,
                    "in_progress": in_progress_tickets,
                    "resolved": resolved_tickets
                }
            }
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")

# Admin Protected Routes - Support Tickets
@api_router.get("/admin/tickets")
async def get_all_tickets(
    status: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Get all support tickets (Admin only)"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        tickets = await db.support_tickets.find(query).sort("created_at", -1).to_list(1000)
        
        for ticket in tickets:
            ticket["_id"] = str(ticket["_id"])
        
        return {
            "success": True,
            "count": len(tickets),
            "tickets": tickets
        }
    except Exception as e:
        logger.error(f"Error fetching tickets: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch tickets")

@api_router.get("/admin/tickets/{ticket_id}")
async def get_ticket(
    ticket_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Get single ticket details (Admin only)"""
    try:
        ticket = await db.support_tickets.find_one({"id": ticket_id})
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        ticket["_id"] = str(ticket["_id"])
        return {"success": True, "ticket": ticket}
    except Exception as e:
        logger.error(f"Error fetching ticket: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch ticket")

@api_router.post("/admin/tickets/{ticket_id}/reply")
async def reply_to_ticket(
    ticket_id: str,
    reply_data: TicketReplyCreate,
    current_admin: dict = Depends(get_current_admin)
):
    """Reply to a support ticket (Admin only)"""
    try:
        ticket = await db.support_tickets.find_one({"id": ticket_id})
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        reply = TicketReply(
            author=current_admin["username"],
            message=reply_data.message,
            is_admin=True
        )
        
        result = await db.support_tickets.update_one(
            {"id": ticket_id},
            {
                "$push": {"replies": reply.dict()},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to add reply")
        
        # Send email notification to customer
        email_service = await get_email_service()
        settings = await db.settings.find_one()
        if settings and settings.get('email_settings', {}).get('enabled'):
            email_service.send_ticket_reply_notification(ticket, reply.dict(), to_customer=True)
        
        return {"success": True, "message": "Reply added successfully"}
    except Exception as e:
        logger.error(f"Error replying to ticket: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add reply")

@api_router.patch("/admin/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    status: str,
    priority: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Update ticket status and priority (Admin only)"""
    try:
        update_data = {"status": status, "updated_at": datetime.utcnow()}
        if priority:
            update_data["priority"] = priority
        
        result = await db.support_tickets.update_one(
            {"id": ticket_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        return {"success": True, "message": "Ticket updated successfully"}
    except Exception as e:
        logger.error(f"Error updating ticket: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update ticket")

@api_router.delete("/admin/tickets/{ticket_id}")
async def delete_ticket(
    ticket_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Delete a ticket (Admin only)"""
    try:
        result = await db.support_tickets.delete_one({"id": ticket_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        return {"success": True, "message": "Ticket deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting ticket: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete ticket")

# Admin Protected Routes - Settings
@api_router.get("/admin/settings")
async def get_settings(current_admin: dict = Depends(get_current_admin)):
    """Get system settings (Admin only)"""
    try:
        settings = await db.settings.find_one()
        if not settings:
            settings = SystemSettings().dict()
        else:
            settings["_id"] = str(settings["_id"])
        
        return {"success": True, "settings": settings}
    except Exception as e:
        logger.error(f"Error fetching settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch settings")

@api_router.put("/admin/settings")
async def update_settings(
    settings_update: SettingsUpdate,
    current_admin: dict = Depends(get_current_admin)
):
    """Update system settings (Admin only)"""
    try:
        existing_settings = await db.settings.find_one()
        
        if not existing_settings:
            new_settings = SystemSettings()
            if settings_update.email_settings:
                new_settings.email_settings = settings_update.email_settings
            if settings_update.seo_settings:
                new_settings.seo_settings = settings_update.seo_settings
            if settings_update.branding:
                new_settings.branding = settings_update.branding
            if settings_update.recaptcha_settings:
                new_settings.recaptcha_settings = settings_update.recaptcha_settings
            new_settings.updated_by = current_admin["username"]
            
            await db.settings.insert_one(new_settings.dict())
        else:
            update_data = {"updated_at": datetime.utcnow(), "updated_by": current_admin["username"]}
            if settings_update.email_settings:
                update_data["email_settings"] = settings_update.email_settings.dict()
            if settings_update.seo_settings:
                update_data["seo_settings"] = settings_update.seo_settings.dict()
            if settings_update.branding:
                update_data["branding"] = settings_update.branding
            if settings_update.recaptcha_settings:
                update_data["recaptcha_settings"] = settings_update.recaptcha_settings
            
            await db.settings.update_one({}, {"$set": update_data})

        # Clear cached settings so frontend gets latest values immediately
        clear_cache()
        
        return {"success": True, "message": "Settings updated successfully"}
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update settings")

@api_router.post("/admin/settings/test-email")
async def test_email_settings(current_admin: dict = Depends(get_current_admin)):
    """Test email settings (Admin only)"""
    try:
        settings = await db.settings.find_one()
        if not settings or not settings.get('email_settings'):
            raise HTTPException(status_code=400, detail="Email settings not configured")
        
        email_service = EmailService(settings['email_settings'])
        test_recipient = settings['email_settings'].get('from_email')
        
        if not test_recipient:
            raise HTTPException(status_code=400, detail="No recipient email configured")
        
        success = email_service.send_email(
            [test_recipient],
            "IXA Digital - Email Test",
            "<h2>Test Email</h2><p>Your email settings are working correctly!</p>",
            "Test Email\n\nYour email settings are working correctly!"
        )
        
        if success:
            return {"success": True, "message": "Test email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email")
    except Exception as e:
        logger.error(f"Error testing email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# File Upload Routes (Admin)
@api_router.post("/admin/upload-logo")
async def upload_logo(
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin)
):
    """Upload logo image (Admin only)"""
    try:
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
        
        content_type = file.content_type
        if content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type: {content_type}. Supported: JPG, PNG, WebP, SVG"
            )
        
        # Validate file size (max 5MB)
        file_content = await file.read()
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Reset file pointer
        await file.seek(0)
        
        # Determine file extension
        if content_type == 'image/svg+xml':
            file_extension = 'svg'
        else:
            file_extension = file.filename.split('.')[-1].lower()
        
        # Generate unique filename
        unique_filename = f"logo_{uuid_lib.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate URL
        file_url = f"/static/uploads/{unique_filename}"
        
        # Update settings
        settings = await db.settings.find_one()
        if settings:
            branding = settings.get('branding', {})
            branding['logo_url'] = file_url
            await db.settings.update_one(
                {},
                {"$set": {"branding": branding, "updated_at": datetime.utcnow()}}
            )
        
        # Clear cache
        clear_cache()
        
        logger.info(f"Logo uploaded: {unique_filename}")
        return {
            "success": True, 
            "url": file_url, 
            "filename": unique_filename,
            "message": "Logo uploaded successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error uploading logo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")

@api_router.post("/admin/upload-favicon")
async def upload_favicon(
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin)
):
    """Upload favicon image (Admin only)"""
    try:
        # Validate file type - accept more formats
        allowed_types = [
            'image/x-icon', 
            'image/vnd.microsoft.icon', 
            'image/png', 
            'image/jpeg', 
            'image/jpg',
            'image/gif',
            'image/svg+xml'
        ]
        
        # Check content type
        content_type = file.content_type
        if content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type: {content_type}. Supported: ICO, PNG, JPG, GIF, SVG"
            )
        
        # Determine file extension
        if content_type in ['image/x-icon', 'image/vnd.microsoft.icon']:
            file_extension = 'ico'
        elif content_type == 'image/svg+xml':
            file_extension = 'svg'
        else:
            file_extension = file.filename.split('.')[-1].lower()
        
        # Generate unique filename
        unique_filename = f"favicon_{uuid_lib.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate URL (relative to match backend serving)
        file_url = f"/static/uploads/{unique_filename}"
        
        # Update settings
        settings = await db.settings.find_one()
        if settings:
            branding = settings.get('branding', {})
            branding['favicon_url'] = file_url
            await db.settings.update_one(
                {},
                {"$set": {"branding": branding, "updated_at": datetime.utcnow()}}
            )
        
        # Clear cache
        clear_cache()
        
        logger.info(f"Favicon uploaded: {unique_filename}")
        return {
            "success": True, 
            "url": file_url, 
            "filename": unique_filename,
            "message": "Favicon uploaded successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error uploading favicon: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload favicon: {str(e)}")

# Content Management Routes (Admin)
@api_router.get("/admin/content/{page}")
async def get_admin_page_content(page: str, current_admin: dict = Depends(get_current_admin)):
    """Get page content for editing (Admin only)"""
    try:
        content = await db.page_content.find_one({"page": page})
        if not content:
            return {"success": False, "message": "Content not found", "content": None}
        
        content["_id"] = str(content["_id"])
        return {"success": True, "content": content}
    except Exception as e:
        logger.error(f"Error fetching content: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch content")

@api_router.put("/admin/content")
async def update_page_content(
    content_update: ContentUpdate,
    current_admin: dict = Depends(get_current_admin)
):
    """Update page content (Admin only)"""
    try:
        existing_content = await db.page_content.find_one({"page": content_update.page})
        
        update_data = {
            "updated_at": datetime.utcnow(),
            "updated_by": current_admin["username"]
        }
        
        # Update only provided fields
        if content_update.hero:
            update_data["hero"] = content_update.hero.dict()
        if content_update.about:
            update_data["about"] = content_update.about.dict()
        if content_update.services:
            update_data["services"] = [s.dict() for s in content_update.services]
        if content_update.menu_items:
            update_data["menu_items"] = [m.dict() for m in content_update.menu_items]
        if content_update.process_steps:
            update_data["process_steps"] = [p.dict() for p in content_update.process_steps]
        if content_update.industries:
            update_data["industries"] = [i.dict() for i in content_update.industries]
        if content_update.footer:
            update_data["footer"] = content_update.footer.dict()
        if content_update.cta_section:
            update_data["cta_section"] = content_update.cta_section
        
        if existing_content:
            logger.info(f"Updating existing content for page: {content_update.page}")
            result = await db.page_content.update_one(
                {"page": content_update.page},
                {"$set": update_data}
            )
            logger.info(f"Update result: matched={result.matched_count}, modified={result.modified_count}")
            if result.modified_count == 0:
                logger.warning("No changes made to content")
                return {"success": False, "message": "No changes made"}
        else:
            # Create new content
            logger.info(f"Creating new content for page: {content_update.page}")
            new_content = PageContent(page=content_update.page, **update_data)
            insert_result = await db.page_content.insert_one(new_content.dict())
            logger.info(f"Inserted new content with id: {insert_result.inserted_id}")
        
        # Clear cache when content is updated
        clear_cache()
        logger.info("Cache cleared")
        
        return {"success": True, "message": "Content updated successfully"}
    except Exception as e:
        logger.error(f"Error updating content: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update content")

@api_router.get("/admin/content-list")
async def get_content_list(current_admin: dict = Depends(get_current_admin)):
    """Get list of all editable pages (Admin only)"""
    try:
        pages = await db.page_content.find().to_list(100)
        for page in pages:
            page["_id"] = str(page["_id"])
        
        return {"success": True, "pages": pages}
    except Exception as e:
        logger.error(f"Error fetching content list: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch content list")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add database indexes for better performance
async def create_indexes():
    """Create database indexes for better query performance"""
    try:
        # Contact submissions indexes
        await db.contact_submissions.create_index("created_at")
        await db.contact_submissions.create_index("status")
        await db.contact_submissions.create_index("email")
        
        # Support tickets indexes
        await db.support_tickets.create_index("ticket_number")
        await db.support_tickets.create_index("customer_email")
        await db.support_tickets.create_index("status")
        await db.support_tickets.create_index("created_at")
        
        # Page content index
        await db.page_content.create_index("page", unique=True)
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"Index creation warning: {str(e)}")

@app.on_event("startup")
async def startup_event():
    await init_defaults()
    await create_indexes()
    logger.info("Application started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("Application shutdown")

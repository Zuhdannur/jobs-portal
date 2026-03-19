"""Utils package for the scraper."""

from .logger import setup_logger
from .database import DatabaseClient, db
from .browser import BrowserManager, managed_browser
from .error_handler import (
    ScrapingException,
    RateLimitException,
    CaptchaException,
    ParseException,
    DatabaseException,
    handle_scraping_error,
    health_check,
)

__all__ = [
    "setup_logger",
    "DatabaseClient",
    "db",
    "BrowserManager",
    "managed_browser",
    "ScrapingException",
    "RateLimitException",
    "CaptchaException",
    "ParseException",
    "DatabaseException",
    "handle_scraping_error",
    "health_check",
]

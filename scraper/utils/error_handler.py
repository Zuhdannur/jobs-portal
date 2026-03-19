"""Error handling and monitoring utilities."""

import sys
import traceback
from typing import Optional, Callable
from functools import wraps

from utils.logger import setup_logger


logger = setup_logger("error_handler")


class ScrapingException(Exception):
    """Base exception for scraping errors."""

    def __init__(self, message: str, platform: str = None, url: str = None):
        super().__init__(message)
        self.platform = platform
        self.url = url


class RateLimitException(ScrapingException):
    """Raised when rate limited by target site."""
    pass


class CaptchaException(ScrapingException):
    """Raised when CAPTCHA is encountered."""
    pass


class ParseException(ScrapingException):
    """Raised when parsing fails."""
    pass


class DatabaseException(Exception):
    """Raised when database operations fail."""
    pass


def handle_scraping_error(func: Callable) -> Callable:
    """Decorator to handle scraping errors gracefully."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except RateLimitException as e:
            logger.warning(f"Rate limited on {e.platform}: {e.url}")
            raise
        except CaptchaException as e:
            logger.warning(f"CAPTCHA encountered on {e.platform}: {e.url}")
            raise
        except ParseException as e:
            logger.error(f"Parse error on {e.platform}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            logger.error(traceback.format_exc())
            raise
    return wrapper


def log_error(platform: str, error: Exception, url: Optional[str] = None):
    """Log an error with context."""
    error_type = type(error).__name__
    message = str(error)

    log_data = {
        "platform": platform,
        "error_type": error_type,
        "message": message,
        "url": url,
    }

    logger.error(f"Scraping error: {log_data}")


class HealthCheck:
    """Health check system for scrapers."""

    def __init__(self):
        self.checks = {}
        self.last_check = {}

    def update(self, platform: str, status: str, message: str = None):
        """Update health status for a platform."""
        self.checks[platform] = {
            "status": status,
            "message": message,
            "last_check": self.last_check.get(platform),
        }
        self.last_check[platform] = status

    def is_healthy(self, platform: str) -> bool:
        """Check if a platform is healthy."""
        return self.checks.get(platform, {}).get("status") == "healthy"

    def get_status(self) -> dict:
        """Get health status for all platforms."""
        return self.checks


# Global health check instance
health_check = HealthCheck()

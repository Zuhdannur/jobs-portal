"""Base scraper class with common functionality."""

import asyncio
import time
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from config import config
from utils.logger import setup_logger
from utils.database import DatabaseClient


class BaseScraper(ABC):
    """Base class for all job scrapers."""

    name: str = ""
    base_url: str = ""
    rate_limit: float = 1.0  # seconds between requests

    def __init__(self, db_client: DatabaseClient):
        self.db = db_client
        self.logger = setup_logger(f"scraper.{self.name}", self.name)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        self.last_request_time: Optional[float] = None

    async def scrape(self) -> Dict[str, Any]:
        """Main scraping method."""
        started_at = datetime.now(timezone.utc)
        self.logger.info(f"Starting scrape for {self.name}")

        try:
            jobs = await self.fetch_jobs()
            inserted = await self.db.insert_jobs_batch(jobs)

            self.logger.info(f"Successfully scraped {len(jobs)} jobs, inserted {inserted}")

            await self.db.log_scraping_run(
                platform=self.name,
                status="success",
                jobs_scraped=inserted,
                started_at=started_at,
            )

            return {
                "platform": self.name,
                "status": "success",
                "jobs_scraped": len(jobs),
                "inserted": inserted,
            }

        except Exception as e:
            self.logger.error(f"Error scraping {self.name}: {str(e)}")

            await self.db.log_scraping_run(
                platform=self.name,
                status="failed",
                jobs_scraped=0,
                error_message=str(e),
                started_at=started_at,
            )

            return {
                "platform": self.name,
                "status": "failed",
                "error": str(e),
            }

    @abstractmethod
    async def fetch_jobs(self) -> List[Dict[str, Any]]:
        """Fetch jobs from the platform. Implement in subclasses."""
        pass

    def rate_limit_request(self):
        """Enforce rate limiting."""
        if self.last_request_time:
            elapsed = time.time() - self.last_request_time
            if elapsed < self.rate_limit:
                time.sleep(self.rate_limit - elapsed)
        self.last_request_time = time.time()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        reraise=True,
    )
    def fetch_page(self, url: str, **kwargs) -> requests.Response:
        """Fetch a page with retry logic and rate limiting."""
        self.rate_limit_request()
        self.logger.info(f"Fetching: {url}")
        response = self.session.get(url, timeout=30, **kwargs)
        response.raise_for_status()
        return response

    def normalize_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize job data to standard format."""
        return {
            "job_title": job.get("job_title", "")[:255],
            "job_description": job.get("job_description", ""),
            "location": job.get("location", "")[:255] if job.get("location") else None,
            "posted_at": job.get("posted_at"),
            "platform": job.get("platform", self.name),
            "source_link": job.get("source_link", ""),
            "job_type": job.get("job_type"),
            "company_name": job.get("company_name", "")[:255] if job.get("company_name") else None,
            "company_logo_url": job.get("company_logo_url"),
            "salary_range": job.get("salary_range", "")[:100] if job.get("salary_range") else None,
            "experience_level": job.get("experience_level"),
            "employment_type": job.get("employment_type"),
            "skills_required": job.get("skills_required", []),
            "application_deadline": job.get("application_deadline"),
            "is_active": True,
        }

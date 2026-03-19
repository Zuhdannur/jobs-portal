"""Scraper orchestration system."""

import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime

from utils.logger import setup_logger
from utils.database import db
from scrapers.linkedin import LinkedInScraper
from scrapers.indeed import IndeedScraper
from scrapers.yc import YCombinatorScraper
from scrapers.glints import GlintsScraper
from scrapers.jobstreet import JobStreetScraper


class ScraperOrchestrator:
    """Orchestrates multiple scrapers."""

    def __init__(self):
        self.logger = setup_logger("orchestrator")
        self.scrapers = self._initialize_scrapers()

    def _initialize_scrapers(self) -> Dict[str, Any]:
        """Initialize all scraper instances."""
        return {
            "linkedin": LinkedInScraper(db),
            "indeed": IndeedScraper(db),
            "yc": YCombinatorScraper(db),
            "glints": GlintsScraper(db),
            "jobstreet": JobStreetScraper(db),
        }

    async def scrape_single(self, platform: str) -> Dict[str, Any]:
        """Scrape a single platform."""
        if platform not in self.scrapers:
            return {
                "platform": platform,
                "status": "failed",
                "error": f"Unknown platform: {platform}",
            }

        scraper = self.scrapers[platform]
        return await scraper.scrape()

    async def scrape_all(self) -> List[Dict[str, Any]]:
        """Scrape all platforms concurrently."""
        self.logger.info("Starting full scraping run")

        tasks = [scraper.scrape() for scraper in self.scrapers.values()]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        processed_results = []
        for platform, result in zip(self.scrapers.keys(), results):
            if isinstance(result, Exception):
                processed_results.append({
                    "platform": platform,
                    "status": "failed",
                    "error": str(result),
                })
            else:
                processed_results.append(result)

        # Summary
        total_jobs = sum(r.get("jobs_scraped", 0) for r in processed_results)
        success_count = sum(1 for r in processed_results if r["status"] == "success")

        self.logger.info(
            f"Completed all scrapers. Total jobs: {total_jobs}, "
            f"Successful: {success_count}/{len(self.scrapers)}"
        )

        return processed_results

    async def scrape_priority(self) -> List[Dict[str, Any]]:
        """Scrape only high-priority platforms."""
        priority_platforms = ["linkedin", "indeed", "yc"]
        self.logger.info(f"Running priority scrape: {priority_platforms}")

        tasks = []
        for platform in priority_platforms:
            if platform in self.scrapers:
                tasks.append(self.scrapers[platform].scrape())

        results = await asyncio.gather(*tasks, return_exceptions=True)

        processed_results = []
        for result in results:
            if isinstance(result, Exception):
                processed_results.append({
                    "status": "failed",
                    "error": str(result),
                })
            else:
                processed_results.append(result)

        return processed_results

    def get_scraper_status(self) -> Dict[str, Any]:
        """Get status of all scrapers."""
        return {
            platform: {
                "name": scraper.name,
                "base_url": scraper.base_url,
                "rate_limit": scraper.rate_limit,
            }
            for platform, scraper in self.scrapers.items()
        }

    def get_stats(self) -> Dict[str, Any]:
        """Get database stats."""
        total_jobs = db.get_job_count()
        platform_counts = {
            platform: db.get_job_count(platform)
            for platform in self.scrapers.keys()
        }

        return {
            "total_active_jobs": total_jobs,
            "jobs_by_platform": platform_counts,
            "scrapers": list(self.scrapers.keys()),
        }

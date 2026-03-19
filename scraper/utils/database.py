"""Database utilities for the scraper."""

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from supabase import create_client, Client

from config import config


class DatabaseClient:
    """Supabase database client wrapper."""

    def __init__(self):
        self.client: Client = create_client(
            config.supabase.url,
            config.supabase.service_key,
        )

    async def insert_job(self, job_data: Dict[str, Any]) -> Optional[str]:
        """Insert a job into the database, checking for duplicates."""
        try:
            # Check for existing job by source_link
            existing = (
                self.client.table("jobs")
                .select("id")
                .eq("source_link", job_data.get("source_link"))
                .execute()
            )

            if existing.data:
                # Update existing job
                job_id = existing.data[0]["id"]
                job_data["last_updated"] = datetime.now(timezone.utc).isoformat()
                job_data["is_active"] = True

                self.client.table("jobs").update(job_data).eq("id", job_id).execute()
                return job_id

            # Insert new job
            result = self.client.table("jobs").insert(job_data).execute()
            return result.data[0]["id"] if result.data else None

        except Exception as e:
            print(f"Error inserting job: {e}")
            return None

    async def insert_jobs_batch(self, jobs: List[Dict[str, Any]]) -> int:
        """Insert multiple jobs, returning count of successful inserts."""
        inserted = 0
        for job in jobs:
            if await self.insert_job(job):
                inserted += 1
        return inserted

    def get_existing_source_links(self, platform: str) -> set:
        """Get existing source links for a platform to avoid duplicates."""
        try:
            result = (
                self.client.table("jobs")
                .select("source_link")
                .eq("platform", platform)
                .execute()
            )
            return {item["source_link"] for item in result.data}
        except Exception:
            return set()

    async def log_scraping_run(
        self,
        platform: str,
        status: str,
        jobs_scraped: int,
        error_message: Optional[str] = None,
        started_at: Optional[datetime] = None,
    ) -> None:
        """Log a scraping run."""
        try:
            log_data = {
                "platform": platform,
                "status": status,
                "jobs_scraped": jobs_scraped,
                "error_message": error_message,
                "started_at": started_at.isoformat() if started_at else datetime.now(timezone.utc).isoformat(),
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
            self.client.table("scraping_logs").insert(log_data).execute()
        except Exception as e:
            print(f"Error logging scraping run: {e}")

    def archive_old_jobs(self, days: int = 30) -> int:
        """Mark jobs as inactive if they haven't been updated in X days."""
        try:
            cutoff_date = datetime.now(timezone.utc) - datetime.timedelta(days=days)
            result = (
                self.client.table("jobs")
                .update({"is_active": False})
                .lt("last_updated", cutoff_date.isoformat())
                .eq("is_active", True)
                .execute()
            )
            return len(result.data)
        except Exception as e:
            print(f"Error archiving old jobs: {e}")
            return 0

    def get_job_count(self, platform: Optional[str] = None) -> int:
        """Get count of active jobs, optionally filtered by platform."""
        try:
            query = self.client.table("jobs").select("id", count="exact").eq("is_active", True)

            if platform:
                query = query.eq("platform", platform)

            result = query.execute()
            return result.count or 0
        except Exception:
            return 0


# Global database client
db = DatabaseClient()

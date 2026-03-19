"""Configuration module for the scraper service."""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class SupabaseConfig:
    """Supabase configuration."""

    url: str
    service_key: str

    @classmethod
    def from_env(cls) -> "SupabaseConfig":
        return cls(
            url=os.getenv("SUPABASE_URL", ""),
            service_key=os.getenv("SUPABASE_SERVICE_KEY", ""),
        )


@dataclass
class CloudflareConfig:
    """Cloudflare configuration for MCP/browser automation."""

    api_key: str

    @classmethod
    def from_env(cls) -> "CloudflareConfig":
        return cls(api_key=os.getenv("CLOUDFLARE_API_KEY", ""))


@dataclass
class ScraperConfig:
    """General scraper configuration."""

    log_level: str
    rate_limit: float  # seconds between requests
    max_retries: int
    redis_url: str

    @classmethod
    def from_env(cls) -> "ScraperConfig":
        return cls(
            log_level=os.getenv("SCRAPER_LOG_LEVEL", "INFO"),
            rate_limit=float(os.getenv("SCRAPER_RATE_LIMIT", "1")),
            max_retries=int(os.getenv("SCRAPER_MAX_RETRIES", "3")),
            redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
        )


@dataclass
class SchedulerConfig:
    """Scheduler configuration."""

    high_priority_hours: int
    standard_hours: int

    @classmethod
    def from_env(cls) -> "SchedulerConfig":
        return cls(
            high_priority_hours=int(os.getenv("SCHEDULER_HIGH_PRIORITY_HOURS", "4")),
            standard_hours=int(os.getenv("SCHEDULER_STANDARD_HOURS", "12")),
        )


class Config:
    """Main configuration class."""

    def __init__(self):
        self.supabase = SupabaseConfig.from_env()
        self.cloudflare = CloudflareConfig.from_env()
        self.scraper = ScraperConfig.from_env()
        self.scheduler = SchedulerConfig.from_env()

    def validate(self) -> bool:
        """Validate that required configuration is present."""
        if not self.supabase.url or not self.supabase.service_key:
            raise ValueError("Supabase URL and service key are required")
        return True


# Global config instance
config = Config()

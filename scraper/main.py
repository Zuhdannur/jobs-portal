"""Main entry point for the scraper service."""

import asyncio
import argparse
from datetime import datetime

from config import config
from utils.logger import setup_logger
from utils.database import db
from orchestrator import ScraperOrchestrator


async def run_single(platform: str):
    """Run a single scraper."""
    logger = setup_logger("main")
    logger.info(f"Running single scraper: {platform}")

    orchestrator = ScraperOrchestrator()
    result = await orchestrator.scrape_single(platform)

    print(f"\n{'='*50}")
    print(f"Scraper: {result['platform']}")
    print(f"Status: {result['status']}")
    print(f"Jobs scraped: {result.get('jobs_scraped', 0)}")
    if 'error' in result:
        print(f"Error: {result['error']}")
    print(f"{'='*50}\n")


async def run_all():
    """Run all scrapers."""
    logger = setup_logger("main")
    logger.info("Running all scrapers")

    orchestrator = ScraperOrchestrator()
    results = await orchestrator.scrape_all()

    print(f"\n{'='*50}")
    print("SCRAPING RESULTS")
    print(f"{'='*50}")
    for result in results:
        print(f"\n{result['platform']}:")
        print(f"  Status: {result['status']}")
        print(f"  Jobs: {result.get('jobs_scraped', 0)}")
        if 'error' in result:
            print(f"  Error: {result['error']}")
    print(f"\n{'='*50}\n")


async def run_scheduler():
    """Run the scheduler for periodic scraping."""
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.interval import IntervalTrigger

    logger = setup_logger("scheduler")
    logger.info("Starting scheduler")

    scheduler = AsyncIOScheduler()
    orchestrator = ScraperOrchestrator()

    # High priority scrapers every 4 hours
    scheduler.add_job(
        orchestrator.scrape_priority,
        trigger=IntervalTrigger(hours=config.scheduler.high_priority_hours),
        id="high_priority",
        replace_existing=True,
    )

    # All scrapers every 12 hours
    scheduler.add_job(
        orchestrator.scrape_all,
        trigger=IntervalTrigger(hours=config.scheduler.standard_hours),
        id="all_scrapers",
        replace_existing=True,
    )

    # Archive old jobs daily
    scheduler.add_job(
        db.archive_old_jobs,
        trigger=IntervalTrigger(days=1),
        id="archive_jobs",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(f"Scheduler started. High priority: {config.scheduler.high_priority_hours}h, Standard: {config.scheduler.standard_hours}h")

    # Keep running
    try:
        while True:
            await asyncio.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down scheduler")
        scheduler.shutdown()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Job Aggregator Scraper")
    parser.add_argument(
        "--platform",
        choices=["linkedin", "indeed", "yc", "glints", "jobstreet"],
        help="Scrape a specific platform",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Scrape all platforms",
    )
    parser.add_argument(
        "--scheduler",
        action="store_true",
        help="Run in scheduler mode",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Validate configuration",
    )

    args = parser.parse_args()

    if args.validate:
        print("Validating configuration...")
        try:
            config.validate()
            print("Configuration is valid!")
        except Exception as e:
            print(f"Configuration error: {e}")
            return 1
        return 0

    # Run the appropriate mode
    if args.platform:
        asyncio.run(run_single(args.platform))
    elif args.scheduler:
        asyncio.run(run_scheduler())
    else:
        asyncio.run(run_all())

    return 0


if __name__ == "__main__":
    exit(main())

"""Y Combinator scraper."""

from typing import List, Dict, Any
from bs4 import BeautifulSoup
from datetime import datetime

from .base import BaseScraper


class YCombinatorScraper(BaseScraper):
    """Scraper for Y Combinator's Work at a Startup."""

    name = "yc"
    base_url = "https://www.workatastartup.com"
    rate_limit = 1.0

    async def fetch_jobs(self) -> List[Dict[str, Any]]:
        """Fetch jobs from Y Combinator."""
        self.logger.info("Fetching Y Combinator jobs")

        try:
            # YC companies page
            response = self.fetch_page(f"{self.base_url}/companies")
            soup = BeautifulSoup(response.content, 'html.parser')

            jobs = []

            # Find company listings
            company_links = soup.find_all('a', href=lambda x: x and '/companies/' in x)

            for company_link in company_links[:5]:  # Limit for demo
                try:
                    company_url = f"{self.base_url}{company_link['href']}"
                    company_jobs = await self.fetch_company_jobs(company_url)
                    jobs.extend(company_jobs)
                except Exception as e:
                    self.logger.warning(f"Error fetching company jobs: {e}")
                    continue

            self.logger.info(f"Found {len(jobs)} Y Combinator jobs")
            return jobs

        except Exception as e:
            self.logger.error(f"Error fetching Y Combinator jobs: {e}")
            return []

    async def fetch_company_jobs(self, company_url: str) -> List[Dict[str, Any]]:
        """Fetch jobs from a specific company page."""
        try:
            response = self.fetch_page(company_url)
            soup = BeautifulSoup(response.content, 'html.parser')

            company_name = self.extract_company_name(soup)
            job_listings = soup.find_all('div', class_='job-listing')

            jobs = []
            for job in job_listings:
                job_data = self.parse_job_listing(job, company_name)
                if job_data:
                    jobs.append(self.normalize_job(job_data))

            return jobs

        except Exception as e:
            self.logger.warning(f"Error fetching company {company_url}: {e}")
            return []

    def extract_company_name(self, soup: BeautifulSoup) -> str:
        """Extract company name from page."""
        name_elem = soup.find('h1')
        return name_elem.text.strip() if name_elem else "Unknown"

    def parse_job_listing(self, job: BeautifulSoup, company_name: str) -> Dict[str, Any]:
        """Parse a job listing."""
        try:
            title_elem = job.find('h3') or job.find('h2')
            link_elem = job.find('a')
            location_elem = job.find(class_='location')

            return {
                'job_title': title_elem.text.strip() if title_elem else 'Unknown',
                'company_name': company_name,
                'location': location_elem.text.strip() if location_elem else None,
                'source_link': f"{self.base_url}{link_elem['href']}" if link_elem else '',
                'platform': 'yc',
                'posted_at': datetime.utcnow().isoformat(),
            }
        except Exception as e:
            self.logger.warning(f"Error parsing YC job: {e}")
            return None

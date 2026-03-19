"""Indeed scraper."""

from typing import List, Dict, Any
from bs4 import BeautifulSoup

from .base import BaseScraper


class IndeedScraper(BaseScraper):
    """Scraper for Indeed job listings."""

    name = "indeed"
    base_url = "https://www.indeed.com"
    rate_limit = 1.5

    async def fetch_jobs(self) -> List[Dict[str, Any]]:
        """Fetch jobs from Indeed."""
        self.logger.info("Fetching Indeed jobs")

        # Example search URL
        search_url = f"{self.base_url}/jobs?q=software+engineer&l=United+States"

        try:
            response = self.fetch_page(search_url)
            soup = BeautifulSoup(response.content, 'html.parser')

            jobs = []
            # Indeed job cards have class "job_seen_beacon" or similar
            job_cards = soup.find_all('div', class_='job_seen_beacon')

            for card in job_cards[:10]:  # Limit for demo
                job = self.parse_job_card(card)
                if job:
                    jobs.append(self.normalize_job(job))

            self.logger.info(f"Found {len(jobs)} Indeed jobs")
            return jobs

        except Exception as e:
            self.logger.error(f"Error fetching Indeed jobs: {e}")
            raise

    def parse_job_card(self, card: BeautifulSoup) -> Dict[str, Any]:
        """Parse an Indeed job card."""
        try:
            title_elem = card.find('h2', class_='jobTitle')
            company_elem = card.find('span', {'data-testid': 'company-name'})
            location_elem = card.find('div', {'data-testid': 'job-location'})
            link_elem = card.find('a', class_='jcs-JobTitle')

            return {
                'job_title': title_elem.text.strip() if title_elem else 'Unknown',
                'company_name': company_elem.text.strip() if company_elem else None,
                'location': location_elem.text.strip() if location_elem else None,
                'source_link': f"{self.base_url}{link_elem['href']}" if link_elem else '',
                'platform': 'indeed',
                'job_type': None,  # Would need to visit detail page
            }
        except Exception as e:
            self.logger.warning(f"Error parsing Indeed job card: {e}")
            return None

"""Glints scraper."""

from typing import List, Dict, Any
from bs4 import BeautifulSoup

from .base import BaseScraper


class GlintsScraper(BaseScraper):
    """Scraper for Glints job listings."""

    name = "glints"
    base_url = "https://glints.com"
    rate_limit = 1.5

    async def fetch_jobs(self) -> List[Dict[str, Any]]:
        """Fetch jobs from Glints."""
        self.logger.info("Fetching Glints jobs")

        try:
            # Glints job search page
            search_url = f"{self.base_url}/jobs?q=software+engineer"
            response = self.fetch_page(search_url)
            soup = BeautifulSoup(response.content, 'html.parser')

            jobs = []

            # Glints job cards
            job_cards = soup.find_all('div', class_='JobCard') or soup.find_all('article', class_='JobCard')

            for card in job_cards[:10]:
                job = self.parse_job_card(card)
                if job:
                    jobs.append(self.normalize_job(job))

            self.logger.info(f"Found {len(jobs)} Glints jobs")
            return jobs

        except Exception as e:
            self.logger.error(f"Error fetching Glints jobs: {e}")
            return []

    def parse_job_card(self, card: BeautifulSoup) -> Dict[str, Any]:
        """Parse a Glints job card."""
        try:
            title_elem = card.find('h3') or card.find(class_='JobTitle')
            company_elem = card.find(class_='CompanyName') or card.find('a', href=lambda x: '/companies/' in x if x else False)
            location_elem = card.find(class_='Location') or card.find(text=lambda x: '·' in x if x else False)
            link_elem = card.find('a', href=lambda x: '/opportunities/' in x if x else False)

            return {
                'job_title': title_elem.text.strip() if title_elem else 'Unknown',
                'company_name': company_elem.text.strip() if company_elem else None,
                'location': location_elem.split('·')[1].strip() if location_elem and '·' in str(location_elem) else location_elem,
                'source_link': f"{self.base_url}{link_elem['href']}" if link_elem else '',
                'platform': 'glints',
            }
        except Exception as e:
            self.logger.warning(f"Error parsing Glints job card: {e}")
            return None

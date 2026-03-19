"""JobStreet scraper."""

from typing import List, Dict, Any
from bs4 import BeautifulSoup

from .base import BaseScraper


class JobStreetScraper(BaseScraper):
    """Scraper for JobStreet job listings."""

    name = "jobstreet"
    base_url = "https://www.jobstreet.com"
    rate_limit = 1.5

    async def fetch_jobs(self) -> List[Dict[str, Any]]:
        """Fetch jobs from JobStreet."""
        self.logger.info("Fetching JobStreet jobs")

        try:
            # JobStreet search URL
            search_url = f"{self.base_url}/en/job-search/software-engineer-jobs"
            response = self.fetch_page(search_url)
            soup = BeautifulSoup(response.content, 'html.parser')

            jobs = []

            # JobStreet job cards
            job_cards = soup.find_all('article', {'data-automation': 'jobListing'}) or soup.find_all('div', class_='job-card')

            for card in job_cards[:10]:
                job = self.parse_job_card(card)
                if job:
                    jobs.append(self.normalize_job(job))

            self.logger.info(f"Found {len(jobs)} JobStreet jobs")
            return jobs

        except Exception as e:
            self.logger.error(f"Error fetching JobStreet jobs: {e}")
            return []

    def parse_job_card(self, card: BeautifulSoup) -> Dict[str, Any]:
        """Parse a JobStreet job card."""
        try:
            title_elem = card.find('a', {'data-automation': 'jobTitle'}) or card.find('h3')
            company_elem = card.find('span', {'data-automation': 'jobCompany'}) or card.find(class_='company')
            location_elem = card.find('span', {'data-automation': 'jobLocation'}) or card.find(class_='location')
            salary_elem = card.find('span', {'data-automation': 'jobSalary'})

            link_elem = title_elem if title_elem and title_elem.name == 'a' else card.find('a', href=True)

            return {
                'job_title': title_elem.text.strip() if title_elem else 'Unknown',
                'company_name': company_elem.text.strip() if company_elem else None,
                'location': location_elem.text.strip() if location_elem else None,
                'source_link': link_elem['href'] if link_elem and link_elem.get('href') and link_elem['href'].startswith('http') else f"{self.base_url}{link_elem['href']}" if link_elem else '',
                'platform': 'jobstreet',
                'salary_range': salary_elem.text.strip() if salary_elem else None,
            }
        except Exception as e:
            self.logger.warning(f"Error parsing JobStreet job card: {e}")
            return None

# Jobs Portal

This project is a Job Portal platform where users can search for and post job opportunities. It's an open-source initiative, and contributions are highly encouraged to make the product even better.

## Founder

**Zuhdan Nur Ihsan**

I'm a Fullstack Developer with 7 years of experience. I've developed this open-source project named "Jobs-Portal". Feel free to contribute to this project to make it better!

Connect with me on LinkedIn: [Zuhdan Nur Ihsan Iskandar](https://www.linkedin.com/in/zuhdan-nur-ihsan-iskandar)

Email me: pczuhdan33@gmail.com

Feel free to contact me if you have a project that needs my expertise!

## Donate

<!-- Donate badges will go here -->

# Tech Stack

The project utilizes a modern full-stack architecture:

-   **Frontend:**
    -   **Framework:** Next.js 14+ (App Router)
    -   **Styling:** Tailwind CSS
    -   **UI Components:** shadcn/ui
    -   **Authentication:** NextAuth.js / Supabase Auth
    -   **State Management:** React Context / Zustand
    -   **Data Fetching:** React Query / SWR
-   **Backend:**
    -   **API Layer:** Next.js API Routes / Server Actions
    -   **Scraping Engine:** Python with BeautifulSoup4 / Scrapy, Selenium / Playwright, and Cloudflare MCP
    -   **Database:** Supabase (PostgreSQL)
    -   **Caching (optional):** Redis
-   **Infrastructure:**
    -   **Containerization:** Docker & Docker Compose
    -   **Hosting:** Vercel (Frontend) / AWS/GCP (Scraping services)
    -   **Scheduling:** Cron jobs / Celery for scheduled scraping
    -   **Storage:** Supabase Storage

# Scraping with Cloudflare MCP

The scraping process is handled by a Python-based engine designed to aggregate job listings from various platforms (LinkedIn, Indeed, Y Combinator, Glints, JobStreet).

## Scraping Strategy:

The strategy focuses on ethical scraping practices, including respecting `robots.txt`, implementing rate limiting (max 1 request/second per domain), and using user-agent rotation.

## Cloudflare MCP Integration:

Cloudflare MCP (Model Context Protocol) is a crucial component of the scraping engine, particularly for handling JavaScript-heavy sites and mitigating anti-bot measures.

**Purpose of Cloudflare MCP:**
-   **Browser automation:** For dynamic content on JavaScript-heavy websites.
-   **IP rotation and anti-bot detection:** To bypass blocking mechanisms.
-   **CAPTCHA handling:** For sites that employ CAPTCHA challenges.
-   **Session management:** To maintain consistent browsing sessions.

**Implementation (Pseudocode Example from `Initialize Plan.md`):**

```python
from cloudflare_mcp import MCPClient

client = MCPClient(api_key=CLOUDFLARE_API_KEY)
browser = client.create_browser()
page = browser.navigate(url)
content = page.get_content()
```

## System Architecture Diagram (Scraping Focus):

The system architecture features a dedicated Python Scraping Engine, containerized with Docker, which utilizes Cloudflare MCP and other tools to interact with the job platforms and feed data into Supabase.

```
┌─────────────────────────────────────────────────────────────┐
│              Python Scraping Engine (Docker)                 │
│  Cloudflare MCP + BeautifulSoup + Selenium/Playwright       │
│              LinkedIn | Indeed | YC | Glints | JobStreet    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Backend)                        │
│         PostgreSQL + Auth + Storage + Real-time              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│         Server Actions / API Routes / Middleware             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                        │
│  Next.js 14 + Tailwind CSS + shadcn/ui + NextAuth.js        │
└─────────────────────────────────────────────────────────────┘
```

This project is an ambitious undertaking to simplify the job search process for many. We welcome all contributions, feedback, and suggestions to help improve and grow Jobs Portal into a robust and user-friendly platform.
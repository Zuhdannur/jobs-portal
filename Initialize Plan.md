# Product Requirements Document (PRD)
## Job Aggregator Platform

**Version:** 1.0  
**Date:** March 19, 2026  
**Document Owner:** Product Team  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Product Overview
A centralized job aggregation platform that scrapes job listings from multiple sources (LinkedIn, Indeed, Y Combinator, Glints, JobStreet) and presents them through a unified, user-friendly interface. The platform enables job seekers to search, filter, and track opportunities from multiple job portals in one place.

### 1.2 Objectives
- Aggregate job listings from 5+ major job portals
- Provide a seamless user experience with modern UI/UX
- Enable users to filter and search across all platforms simultaneously
- Store and update job listings in real-time
- Offer authentication for personalized job tracking

### 1.3 Success Metrics
- Successfully scrape and store 1,000+ active job listings within first month
- Achieve 95%+ data accuracy rate
- Daily data refresh for all job portals
- User authentication success rate >99%
- Page load time <2 seconds

---

## 2. Technical Architecture

### 2.1 Tech Stack

#### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** NextAuth.js / Supabase Auth
- **State Management:** React Context / Zustand
- **Data Fetching:** React Query / SWR

#### Backend
- **API Layer:** Next.js API Routes / Server Actions
- **Scraping Engine:** Python with:
  - Cloudflare MCP (Model Context Protocol)
  - BeautifulSoup4 / Scrapy
  - Selenium / Playwright (for dynamic content)
- **Database:** Supabase (PostgreSQL)
- **Caching:** Redis (optional for performance)

#### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Hosting:** Vercel (Frontend) / AWS/GCP (Scraping services)
- **Scheduling:** Cron jobs / Celery for scheduled scraping
- **Storage:** Supabase Storage for assets

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                        │
│  Next.js 14 + Tailwind CSS + shadcn/ui + NextAuth.js        │
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
│                    Supabase (Backend)                        │
│         PostgreSQL + Auth + Storage + Real-time              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Python Scraping Engine (Docker)                 │
│  Cloudflare MCP + BeautifulSoup + Selenium/Playwright       │
│              LinkedIn | Indeed | YC | Glints | JobStreet    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Features

### 3.1 Job Scraping Engine

#### 3.1.1 Supported Platforms
1. **LinkedIn** - Job search results and job detail pages
2. **Indeed** - Job listings and company pages
3. **Y Combinator (Work at a Startup)** - Startup job board
4. **Glints** - Southeast Asia focused job portal
5. **JobStreet** - Regional job portal

#### 3.1.2 Data Fields to Scrape

**Required Fields:**
- `job_title` (string, max 255 chars)
- `job_description` (text, full HTML or markdown)
- `location` (string, max 255 chars)
- `posted_at` (timestamp)
- `platform` (enum: 'linkedin', 'indeed', 'yc', 'glints', 'jobstreet')
- `source_link` (string, unique URL)
- `job_type` (enum: 'remote', 'office', 'hybrid')

**Optional/Derived Fields:**
- `company_name` (string)
- `company_logo_url` (string)
- `salary_range` (string, if available)
- `experience_level` (string: entry, mid, senior)
- `employment_type` (string: full-time, part-time, contract)
- `skills_required` (array of strings)
- `application_deadline` (timestamp, if available)
- `scraped_at` (timestamp, auto-generated)
- `last_updated` (timestamp, auto-generated)
- `is_active` (boolean, default true)

#### 3.1.3 Scraping Strategy

**Rate Limiting & Ethics:**
- Respect robots.txt for each platform
- Implement rate limiting (max 1 request/second per domain)
- User-agent rotation to avoid blocking
- Implement exponential backoff on errors
- Use Cloudflare MCP for proxy/rotation capabilities

**Scraping Schedule:**
- **High Priority Jobs:** Every 4 hours
- **Standard Jobs:** Every 12 hours
- **Archived Jobs:** Mark inactive after 30 days without update

**Error Handling:**
- Log all scraping errors to database
- Retry failed scrapes up to 3 times
- Alert system for persistent failures
- Maintain scraping health dashboard

#### 3.1.4 Cloudflare MCP Integration

**Purpose:**
- Browser automation for JavaScript-heavy sites
- IP rotation and anti-bot detection
- CAPTCHA handling
- Session management

**Implementation:**
```python
# Pseudocode example
from cloudflare_mcp import MCPClient

client = MCPClient(api_key=CLOUDFLARE_API_KEY)
browser = client.create_browser()
page = browser.navigate(url)
content = page.get_content()
```

### 3.2 Database Schema (Supabase)

#### 3.2.1 Tables

**`jobs` Table:**
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_title VARCHAR(255) NOT NULL,
    job_description TEXT,
    location VARCHAR(255),
    posted_at TIMESTAMP WITH TIME ZONE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('linkedin', 'indeed', 'yc', 'glints', 'jobstreet')),
    source_link VARCHAR(500) UNIQUE NOT NULL,
    job_type VARCHAR(50) CHECK (job_type IN ('remote', 'office', 'hybrid')),
    company_name VARCHAR(255),
    company_logo_url TEXT,
    salary_range VARCHAR(100),
    experience_level VARCHAR(50),
    employment_type VARCHAR(50),
    skills_required TEXT[], -- Array of skills
    application_deadline TIMESTAMP WITH TIME ZONE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_platform ON jobs(platform);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_source_link ON jobs(source_link);
```

**`users` Table (Supabase Auth):**
```sql
-- Extends Supabase auth.users
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    preferred_locations TEXT[],
    preferred_job_types TEXT[],
    saved_searches JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**`saved_jobs` Table:**
```sql
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interviewing', 'rejected', 'accepted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);
```

**`scraping_logs` Table:**
```sql
CREATE TABLE scraping_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
    jobs_scraped INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.2.2 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policies for saved_jobs
CREATE POLICY "Users can view own saved jobs" ON saved_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved jobs" ON saved_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved jobs" ON saved_jobs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved jobs" ON saved_jobs
    FOR DELETE USING (auth.uid() = user_id);

-- Jobs table is publicly readable
CREATE POLICY "Jobs are publicly readable" ON jobs
    FOR SELECT USING (is_active = TRUE);
```

### 3.3 Frontend Features

#### 3.3.1 Authentication System

**Features:**
- Email/Password registration and login
- OAuth providers (Google, GitHub - optional)
- Email verification
- Password reset flow
- Protected routes with middleware
- Session management

**Pages:**
- `/login` - Login page
- `/signup` - Registration page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset with token

**Implementation:**
```typescript
// Using Supabase Auth with NextAuth.js
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})
```

#### 3.3.2 Job Listing Pages

**Home Page (`/`):**
- Hero section with search bar
- Featured/recent jobs
- Platform filters (chips/badges)
- Quick stats (total jobs, companies, locations)

**Job Search Page (`/jobs`):**
- Advanced search and filters sidebar:
  - Platform selection (multi-select)
  - Job type (remote/office/hybrid)
  - Location (autocomplete)
  - Date posted (last 24h, week, month)
  - Experience level
  - Salary range
- Job cards with:
  - Company logo
  - Job title
  - Company name
  - Location
  - Job type badge
  - Platform badge
  - Posted date
  - Save button (for authenticated users)
- Pagination or infinite scroll
- Sort options (relevance, date, salary)

**Job Detail Page (`/jobs/[id]`):**
- Full job description (rendered HTML)
- Company information
- Apply button (redirects to source_link)
- Save job button
- Share functionality
- Similar jobs section
- Breadcrumb navigation

**Saved Jobs Page (`/saved`) - Protected:**
- User's saved jobs with status tracking
- Filter by application status
- Notes for each job
- Export to CSV functionality

**User Dashboard (`/dashboard`) - Protected:**
- Overview of saved jobs
- Application status tracking
- Recent searches
- Profile settings

#### 3.3.3 UI Components (shadcn/ui)

**Required Components:**
- `Button` - Primary actions
- `Card` - Job listings, containers
- `Input` - Search, form fields
- `Select` - Dropdown filters
- `Badge` - Job type, platform indicators
- `Dialog` - Modals, confirmations
- `Tabs` - Navigation between sections
- `Skeleton` - Loading states
- `Pagination` - Job list navigation
- `Avatar` - User profile
- `Dropdown Menu` - User menu, actions
- `Toast` - Notifications
- `Form` - Authentication, filters
- `Command` - Search with keyboard shortcuts

#### 3.3.4 Responsive Design

**Breakpoints (Tailwind CSS):**
- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`

**Mobile-First Approach:**
- Collapsible filters drawer on mobile
- Hamburger menu for navigation
- Touch-friendly buttons and cards
- Optimized images and lazy loading

### 3.4 API Endpoints

#### 3.4.1 Public Endpoints

**GET `/api/jobs`**
- Query params: `platform`, `job_type`, `location`, `page`, `limit`, `search`
- Returns: Paginated job listings

**GET `/api/jobs/[id]`**
- Returns: Single job detail

**GET `/api/stats`**
- Returns: Platform statistics (total jobs, by platform, etc.)

#### 3.4.2 Protected Endpoints

**POST `/api/jobs/save`**
- Body: `{ job_id, notes }`
- Returns: Saved job record

**GET `/api/user/saved-jobs`**
- Query params: `status`, `page`, `limit`
- Returns: User's saved jobs

**PATCH `/api/user/saved-jobs/[id]`**
- Body: `{ status, notes }`
- Returns: Updated saved job

**DELETE `/api/user/saved-jobs/[id]`**
- Returns: Success message

#### 3.4.3 Admin Endpoints (Optional)

**POST `/api/admin/scrape`**
- Body: `{ platform }`
- Triggers: Manual scraping job
- Returns: Job ID for tracking

**GET `/api/admin/logs`**
- Returns: Scraping logs and health metrics

---

## 4. Development Phases

### Phase 1: Foundation (Weeks 1-2)
**Goals:**
- Set up Next.js project with TypeScript
- Configure Tailwind CSS and shadcn/ui
- Set up Supabase project and database schema
- Implement authentication flow
- Create basic UI layouts and components

**Deliverables:**
- Working Next.js application
- Authentication system (login/signup)
- Database schema deployed to Supabase
- Basic home and job listing pages

### Phase 2: Scraping Engine (Weeks 3-4)
**Goals:**
- Build Python scraping modules for each platform
- Implement Cloudflare MCP integration
- Create scraping orchestration system
- Set up Docker containers for scraping services
- Implement error handling and logging

**Deliverables:**
- Working scrapers for all 5 platforms
- Dockerized scraping service
- Scheduled scraping jobs (cron)
- Data flowing into Supabase

### Phase 3: Core Features (Weeks 5-6)
**Goals:**
- Build job search and filtering
- Implement job detail pages
- Create saved jobs functionality
- Add user dashboard
- Implement real-time updates (optional)

**Deliverables:**
- Fully functional job search
- User can save and track jobs
- Dashboard with statistics

### Phase 4: Polish & Optimization (Weeks 7-8)
**Goals:**
- Performance optimization (caching, lazy loading)
- SEO optimization (meta tags, sitemaps)
- Error boundary and loading states
- Accessibility improvements (a11y)
- Security hardening
- User testing and bug fixes

**Deliverables:**
- Production-ready application
- Documentation (README, API docs)
- Deployment to production

---

## 5. Docker Configuration

### 5.1 Docker Compose Structure

```yaml
version: '3.8'

services:
  # Frontend (Next.js)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - scraper
    networks:
      - app-network

  # Scraping Service (Python)
  scraper:
    build:
      context: ./scraper
      dockerfile: Dockerfile
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - CLOUDFLARE_API_KEY=${CLOUDFLARE_API_KEY}
    volumes:
      - ./scraper:/app
      - scraper-logs:/app/logs
    networks:
      - app-network

  # Optional: Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  scraper-logs:
```

### 5.2 Dockerfile Examples

**Frontend Dockerfile (Next.js):**
```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**Scraper Dockerfile (Python):**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

CMD ["python", "scraper/main.py"]
```

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Page load time: < 2 seconds
- API response time: < 500ms
- Database queries: < 100ms
- Scraping cycle: Complete all platforms within 1 hour

### 6.2 Scalability
- Support 100,000+ job listings
- Handle 10,000+ concurrent users
- Horizontal scaling for scraping services

### 6.3 Security
- HTTPS only (SSL/TLS)
- Environment variables for secrets
- Rate limiting on API endpoints
- SQL injection prevention (Supabase handles this)
- XSS protection (Next.js built-in)
- CSRF protection for forms
- Secure authentication (JWT tokens)

### 6.4 Reliability
- 99.9% uptime target
- Automated backups (Supabase)
- Error monitoring (Sentry or similar)
- Logging and alerting for scraping failures

### 6.5 Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatible
- Semantic HTML
- Sufficient color contrast

### 6.6 SEO
- Server-side rendering (Next.js)
- Meta tags for all pages
- OpenGraph tags for social sharing
- XML sitemap
- Robots.txt configuration
- Structured data (JSON-LD)

---

## 7. Technical Considerations

### 7.1 Legal & Ethical Scraping
- **Terms of Service Compliance:** Review each platform's ToS
- **robots.txt Respect:** Implement checks before scraping
- **Rate Limiting:** Prevent server overload
- **Data Attribution:** Link back to original job postings
- **No Personal Data:** Avoid scraping applicant information
- **User-Agent Declaration:** Identify scraper clearly

### 7.2 Anti-Scraping Mitigation
- **CAPTCHA Handling:** Use Cloudflare MCP or 2Captcha API
- **IP Rotation:** Proxy pools via Cloudflare
- **User-Agent Rotation:** Randomize browser signatures
- **Request Throttling:** Delay between requests
- **Session Management:** Maintain cookies and headers
- **Headless Browser Detection:** Use stealth plugins

### 7.3 Data Quality
- **Deduplication:** Check source_link uniqueness
- **Validation:** Ensure required fields are populated
- **Sanitization:** Clean HTML, remove scripts
- **Normalization:** Standardize location names, job types
- **Verification:** Manual spot-checks on scraped data

### 7.4 Monitoring & Observability
- **Application Monitoring:** Vercel Analytics or Sentry
- **Scraping Health Dashboard:** Track success rates per platform
- **Database Monitoring:** Supabase built-in metrics
- **Log Aggregation:** Centralized logging (CloudWatch, Datadog)
- **Alerts:** Email/Slack notifications for failures

---

## 8. Dependencies & Tools

### 8.1 Frontend Dependencies
```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.300.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.1.0",
    "prettier": "^3.1.0"
  }
}
```

### 8.2 Backend Dependencies (Python)
```txt
# requirements.txt
supabase==2.0.0
python-dotenv==1.0.0
beautifulsoup4==4.12.0
requests==2.31.0
selenium==4.16.0
playwright==1.40.0
scrapy==2.11.0
cloudflare-mcp-sdk==1.0.0  # hypothetical
lxml==4.9.3
redis==5.0.1
celery==5.3.4
python-dateutil==2.8.2
pydantic==2.5.0
```

### 8.3 Development Tools
- **Code Editor:** VS Code with extensions (ESLint, Prettier, Tailwind IntelliSense)
- **Version Control:** Git + GitHub/GitLab
- **API Testing:** Postman or Thunder Client
- **Database Client:** Supabase Studio / TablePlus
- **Container Management:** Docker Desktop
- **CI/CD:** GitHub Actions or Vercel

---

## 9. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Platform blocking scrapers | High | High | Use Cloudflare MCP, rotate IPs, respect rate limits |
| Website structure changes | High | Medium | Modular scraper design, monitoring alerts |
| Legal issues (ToS violations) | Medium | High | Legal review, add disclaimers, attribute sources |
| Supabase rate limits | Low | Medium | Implement caching, optimize queries |
| Data quality issues | Medium | Medium | Validation rules, manual QA, user reporting |
| Scaling costs | Medium | Medium | Optimize scraping frequency, use free tiers initially |

---

## 10. Future Enhancements (Post-MVP)

### Phase 2 Features:
- Job alerts via email/push notifications
- AI-powered job recommendations
- Resume upload and matching
- Company reviews integration
- Salary insights and analytics
- Mobile app (React Native)
- Advanced analytics dashboard
- Job application tracking with timeline
- Browser extension for quick saves
- API for third-party integrations

### Phase 3 Features:
- Multi-language support (i18n)
- Dark mode
- Export saved jobs to PDF
- Integration with calendar for interviews
- Community features (forums, reviews)
- Premium subscription tier

---

## 11. Success Criteria

### Launch Criteria:
- [ ] All 5 platforms scraping successfully
- [ ] 1,000+ active job listings in database
- [ ] Authentication system fully functional
- [ ] Search and filter working correctly
- [ ] Mobile responsive design implemented
- [ ] Page load time < 2 seconds
- [ ] Zero critical security vulnerabilities
- [ ] Documentation complete

### Post-Launch (30 Days):
- [ ] 5,000+ job listings
- [ ] 500+ registered users
- [ ] 95%+ scraping success rate
- [ ] 99% uptime
- [ ] Average of 10+ saved jobs per active user

---

## 12. Appendices

### A. Environment Variables

```bash
# .env.local (Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# .env (Scraper)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=xxxxx
CLOUDFLARE_API_KEY=xxxxx
REDIS_URL=redis://localhost:6379
```

### B. Folder Structure

```
job-aggregator/
├── frontend/                 # Next.js application
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   └── saved/
│   │   ├── jobs/
│   │   │   └── [id]/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── job-card.tsx
│   │   ├── filters.tsx
│   │   └── navbar.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   └── utils.ts
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── scraper/                  # Python scraping service
│   ├── scrapers/
│   │   ├── linkedin.py
│   │   ├── indeed.py
│   │   ├── yc.py
│   │   ├── glints.py
│   │   └── jobstreet.py
│   ├── utils/
│   │   ├── cloudflare_mcp.py
│   │   ├── database.py
│   │   └── helpers.py
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### C. Glossary

- **MCP:** Model Context Protocol - Cloudflare's browser automation service
- **RLS:** Row Level Security - Supabase security feature
- **shadcn/ui:** Component library built on Radix UI
- **Scraping:** Automated extraction of data from websites
- **SSR:** Server-Side Rendering
- **API Route:** Next.js server endpoint

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | March 19, 2026 | Product Team | Initial draft |

**Review & Approval:**
- [ ] Product Manager
- [ ] Engineering Lead
- [ ] Design Lead
- [ ] Legal Team (for scraping compliance)

**Next Review Date:** April 1, 2026

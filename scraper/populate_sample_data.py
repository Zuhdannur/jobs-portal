"""Test script to populate sample job data."""

import asyncio
from datetime import datetime, timezone, timedelta
from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://fptlinnfbkqnholkedta.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Sample job data for testing
SAMPLE_JOBS = [
    {
        "job_title": "Senior Software Engineer",
        "job_description": "<p>We are looking for a Senior Software Engineer to join our team. You will be responsible for building scalable web applications using React, Node.js, and TypeScript.</p><h3>Requirements:</h3><ul><li>5+ years of experience</li><li>Strong TypeScript skills</li><li>Experience with React and Node.js</li></ul>",
        "location": "San Francisco, CA",
        "posted_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
        "platform": "linkedin",
        "source_link": "https://linkedin.com/jobs/1",
        "job_type": "hybrid",
        "company_name": "TechCorp Inc.",
        "company_logo_url": "https://via.placeholder.com/150",
        "salary_range": "$150,000 - $200,000",
        "experience_level": "Senior",
        "employment_type": "Full-time",
        "skills_required": ["React", "TypeScript", "Node.js", "AWS"],
        "is_active": True,
    },
    {
        "job_title": "Full Stack Developer",
        "job_description": "<p>Join our growing startup as a Full Stack Developer. We use Next.js, Python, and PostgreSQL.</p><h3>Responsibilities:</h3><ul><li>Build full-stack features</li><li>Optimize database queries</li><li>Write tests</li></ul>",
        "location": "Remote",
        "posted_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        "platform": "indeed",
        "source_link": "https://indeed.com/jobs/1",
        "job_type": "remote",
        "company_name": "StartupXYZ",
        "company_logo_url": "https://via.placeholder.com/150",
        "salary_range": "$120,000 - $160,000",
        "experience_level": "Mid",
        "employment_type": "Full-time",
        "skills_required": ["Next.js", "Python", "PostgreSQL", "Docker"],
        "is_active": True,
    },
    {
        "job_title": "Frontend Engineer",
        "job_description": "<p>Looking for a Frontend Engineer to help build beautiful user interfaces. We're a YC-backed company building the future of AI.</p>",
        "location": "New York, NY",
        "posted_at": datetime.now(timezone.utc).isoformat(),
        "platform": "yc",
        "source_link": "https://ycombinator.com/jobs/1",
        "job_type": "office",
        "company_name": "AI Startup",
        "company_logo_url": "https://via.placeholder.com/150",
        "salary_range": "$130,000 - $180,000",
        "experience_level": "Mid",
        "employment_type": "Full-time",
        "skills_required": ["React", "TypeScript", "Tailwind CSS", "GraphQL"],
        "is_active": True,
    },
    {
        "job_title": "Backend Developer (Go)",
        "job_description": "<p>We're hiring a Backend Developer to work on our microservices architecture. Experience with Go and Kubernetes is required.</p>",
        "location": "Singapore",
        "posted_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
        "platform": "glints",
        "source_link": "https://glints.com/jobs/1",
        "job_type": "hybrid",
        "company_name": "Fintech Solutions",
        "company_logo_url": "https://via.placeholder.com/150",
        "salary_range": "S$80,000 - S$120,000",
        "experience_level": "Senior",
        "employment_type": "Full-time",
        "skills_required": ["Go", "Kubernetes", "PostgreSQL", "gRPC"],
        "is_active": True,
    },
    {
        "job_title": "Mobile Developer (React Native)",
        "job_description": "<p>Join our mobile team to build cross-platform apps. You should have experience with React Native and mobile performance optimization.</p>",
        "location": "Kuala Lumpur, Malaysia",
        "posted_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
        "platform": "jobstreet",
        "source_link": "https://jobstreet.com/jobs/1",
        "job_type": "office",
        "company_name": "MobileFirst Apps",
        "company_logo_url": "https://via.placeholder.com/150",
        "salary_range": "RM 8,000 - RM 12,000",
        "experience_level": "Mid",
        "employment_type": "Full-time",
        "skills_required": ["React Native", "TypeScript", "iOS", "Android"],
        "is_active": True,
    },
    {
        "job_title": "DevOps Engineer",
        "job_description": "<p>Looking for a DevOps Engineer to manage our cloud infrastructure. Experience with AWS, Terraform, and CI/CD pipelines required.</p>",
        "location": "Remote",
        "posted_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
        "platform": "linkedin",
        "source_link": "https://linkedin.com/jobs/2",
        "job_type": "remote",
        "company_name": "CloudScale",
        "company_logo_url": "https://via.placeholder.com/150",
        "salary_range": "$140,000 - $190,000",
        "experience_level": "Senior",
        "employment_type": "Full-time",
        "skills_required": ["AWS", "Terraform", "Docker", "Kubernetes", "GitHub Actions"],
        "is_active": True,
    },
    {
        "job_title": "Junior Web Developer",
        "job_description": "<p>Great opportunity for a junior developer! We provide mentorship and training. You'll work with modern JavaScript frameworks.</p>",
        "location": "Jakarta, Indonesia",
        "posted_at": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(),
        "platform": "glints",
        "source_link": "https://glints.com/jobs/2",
        "job_type": "office",
        "company_name": "Digital Agency",
        "company_logo_url": "https://via.placeholder.com/150",
        "salary_range": "IDR 8,000,000 - 12,000,000",
        "experience_level": "Entry",
        "employment_type": "Full-time",
        "skills_required": ["HTML", "CSS", "JavaScript", "Vue.js"],
        "is_active": True,
    },
    {
        "job_title": "Data Engineer",
        "job_description": "<p>Help us build data pipelines and analytics infrastructure. SQL and Python expertise required.</p>",
        "location": "Bangkok, Thailand",
        "posted_at": (datetime.now(timezone.utc) - timedelta(days=6)).isoformat(),
        "platform": "jobstreet",
        "source_link": "https://jobstreet.com/jobs/2",
        "job_type": "hybrid",
        "company_name": "DataCorp",
        "company_logo_url": "https://via.placeholder.com/150",
        "salary_range": "฿100,000 - ฿150,000",
        "experience_level": "Senior",
        "employment_type": "Full-time",
        "skills_required": ["Python", "SQL", "Apache Airflow", "Snowflake", "dbt"],
        "is_active": True,
    },
    {
        "job_title": "Product Manager",
        "job_description": "<p>Join our product team to lead the development of new features. Experience in agile methodologies and user research required.</p>",
        "location": "Singapore",
        "posted_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        "platform": "indeed",
        "source_link": "https://indeed.com/jobs/2",
        "job_type": "office",
        "company_name": "ProductCo",
        "company_logo_url": "https://via.placeholder.com/150",
        "salary_range": "S$100,000 - S$140,000",
        "experience_level": "Mid",
        "employment_type": "Full-time",
        "skills_required": ["Agile", "User Research", "Product Strategy", "Analytics"],
        "is_active": True,
    },
    {
        "job_title": "Machine Learning Engineer",
        "job_description": "<p>Build ML models and deploy them to production. PhD or strong research background preferred.</p>",
        "location": "Remote",
        "posted_at": datetime.now(timezone.utc).isoformat(),
        "platform": "linkedin",
        "source_link": "https://linkedin.com/jobs/3",
        "job_type": "remote",
        "company_name": "AI Labs",
        "company_logo_url": "https://via.placeholder.com/150",
        "salary_range": "$180,000 - $250,000",
        "experience_level": "Senior",
        "employment_type": "Full-time",
        "skills_required": ["Python", "PyTorch", "TensorFlow", "MLOps", "AWS"],
        "is_active": True,
    },
]


async def populate_sample_jobs():
    """Insert sample jobs into the database."""

    print(f"Connecting to Supabase: {SUPABASE_URL}")

    if not SUPABASE_SERVICE_KEY:
        print("ERROR: SUPABASE_SERVICE_KEY not set!")
        print("Please set your Supabase service role key in the .env file")
        return

    # Create Supabase client
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    print(f"\nInserting {len(SAMPLE_JOBS)} sample jobs...\n")

    inserted_count = 0
    error_count = 0

    for i, job in enumerate(SAMPLE_JOBS, 1):
        try:
            # Check if job already exists
            existing = (
                client.table("jobs")
                .select("id")
                .eq("source_link", job["source_link"])
                .execute()
            )

            if existing.data:
                print(f"[{i}/{len(SAMPLE_JOBS)}] ⚠️  Job already exists: {job['job_title'][:40]}...")
                # Update the job instead
                job_id = existing.data[0]["id"]
                job["last_updated"] = datetime.now(timezone.utc).isoformat()

                result = (
                    client.table("jobs")
                    .update(job)
                    .eq("id", job_id)
                    .execute()
                )
                print(f"       ✅ Updated existing job")
                inserted_count += 1
            else:
                # Insert new job
                result = client.table("jobs").insert(job).execute()
                print(f"[{i}/{len(SAMPLE_JOBS)}] ✅ Inserted: {job['job_title'][:40]}... ({job['platform']})")
                inserted_count += 1

        except Exception as e:
            print(f"[{i}/{len(SAMPLE_JOBS)}] ❌ Error: {job['job_title'][:40]}... - {str(e)}")
            error_count += 1

    print(f"\n{'='*60}")
    print(f"SUMMARY:")
    print(f"  Total jobs processed: {len(SAMPLE_JOBS)}")
    print(f"  Successful: {inserted_count}")
    print(f"  Errors: {error_count}")
    print(f"{'='*60}\n")

    # Verify count
    try:
        result = client.table("jobs").select("*", count="exact").eq("is_active", True).execute()
        print(f"Total active jobs in database: {result.count}")
    except Exception as e:
        print(f"Could not get job count: {e}")


if __name__ == "__main__":
    # Install python-dotenv if needed
    try:
        from dotenv import load_dotenv
    except ImportError:
        print("Installing required packages...")
        import subprocess
        subprocess.run(["pip", "install", "python-dotenv"], check=True)
        from dotenv import load_dotenv

    asyncio.run(populate_sample_jobs())

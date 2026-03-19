'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  ExternalLink,
  Bookmark,
  Share2,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase/client';
import { JobCard } from '@/components/job-card';

interface Job {
  id: string;
  job_title: string;
  job_description: string;
  company_name: string | null;
  company_logo_url: string | null;
  location: string | null;
  job_type: string | null;
  platform: string;
  posted_at: string | null;
  source_link: string;
  salary_range: string | null;
  experience_level: string | null;
  employment_type: string | null;
  skills_required: string[];
  application_deadline: string | null;
}

const platformLabels: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  yc: 'Y Combinator',
  glints: 'Glints',
  jobstreet: 'JobStreet',
};

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-800',
  indeed: 'bg-orange-100 text-orange-800',
  yc: 'bg-orange-500 text-white',
  glints: 'bg-green-100 text-green-800',
  jobstreet: 'bg-red-100 text-red-800',
};

const jobTypeColors: Record<string, string> = {
  remote: 'bg-green-100 text-green-800',
  office: 'bg-blue-100 text-blue-800',
  hybrid: 'bg-purple-100 text-purple-800',
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const jobId = params.id as string;

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    setLoading(true);

    // Fetch job details
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('is_active', true)
      .single();

    if (jobError) {
      console.error('Error fetching job:', jobError);
      setLoading(false);
      return;
    }

    setJob(jobData as Job);

    // Fetch similar jobs
    const { data: similarData } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .neq('id', jobId)
      .or(`job_type.eq.${jobData.job_type},platform.eq.${jobData.platform}`)
      .limit(3);

    setSimilarJobs((similarData as Job[]) || []);
    setLoading(false);
  };

  const handleSaveJob = async () => {
    // TODO: Implement save job functionality
    setIsSaved(!isSaved);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.job_title || 'Job Opening',
          text: `Check out this job: ${job?.job_title} at ${job?.company_name}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const daysAgo = job?.posted_at
    ? Math.floor((Date.now() - new Date(job.posted_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-40 w-full mt-6" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The job you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/jobs">
            <Button>Browse All Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>

        {/* Job Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border">
                <AvatarImage src={job.company_logo_url || ''} alt={job.company_name || ''} />
                <AvatarFallback className="bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-2xl font-bold">{job.job_title}</h1>
                {job.company_name && (
                  <p className="text-lg text-muted-foreground mt-1">{job.company_name}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className={platformColors[job.platform]}>
                    {platformLabels[job.platform] || job.platform}
                  </Badge>
                  {job.job_type && (
                    <Badge variant="secondary" className={jobTypeColors[job.job_type]}>
                      {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                    </Badge>
                  )}
                  {job.employment_type && (
                    <Badge variant="secondary">{job.employment_type}</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {daysAgo !== null && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{daysAgo === 0 ? 'Posted Today' : `Posted ${daysAgo} days ago`}</span>
                    </div>
                  )}
                  {job.experience_level && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{job.experience_level}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
              <a href={job.source_link} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto" size="lg">
                  Apply on {platformLabels[job.platform] || job.platform}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Button
                variant="outline"
                size="lg"
                onClick={handleSaveJob}
              >
                <Bookmark className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save Job'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.job_description }}
                />
              </CardContent>
            </Card>

            {/* Skills */}
            {job.skills_required && job.skills_required.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Salary Info */}
            {job.salary_range && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Salary Range</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{job.salary_range}</p>
                </CardContent>
              </Card>
            )}

            {/* Application Deadline */}
            {job.application_deadline && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Application Deadline</span>
                  </div>
                  <p className="font-medium">
                    {new Date(job.application_deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Company</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={job.company_logo_url || ''} />
                    <AvatarFallback>
                      <Building2 className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{job.company_name || 'Unknown Company'}</p>
                    <p className="text-sm text-muted-foreground">{job.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Jobs */}
        {similarJobs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Similar Jobs</h2>
            <div className="space-y-4">
              {similarJobs.map((similarJob) => (
                <JobCard key={similarJob.id} job={similarJob} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

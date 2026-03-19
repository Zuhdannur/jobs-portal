'use client';

import Link from 'next/link';
import { MapPin, Calendar, Building2, Bookmark, ExternalLink } from 'lucide-react';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Job {
  id: string;
  job_title: string;
  company_name: string | null;
  company_logo_url: string | null;
  location: string | null;
  job_type: string | null;
  platform: string;
  posted_at: string | null;
  salary_range: string | null;
  employment_type: string | null;
}

interface JobCardProps {
  job: Job;
  showSaveButton?: boolean;
}

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-800',
  indeed: 'bg-orange-100 text-orange-800',
  yc: 'bg-orange-500 text-white',
  glints: 'bg-green-100 text-green-800',
  jobstreet: 'bg-red-100 text-red-800',
};

const platformLabels: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  yc: 'Y Combinator',
  glints: 'Glints',
  jobstreet: 'JobStreet',
};

const jobTypeColors: Record<string, string> = {
  remote: 'bg-green-100 text-green-800',
  office: 'bg-blue-100 text-blue-800',
  hybrid: 'bg-purple-100 text-purple-800',
};

export function JobCard({ job, showSaveButton = true }: JobCardProps) {
  const daysAgo = job.posted_at
    ? Math.floor((Date.now() - new Date(job.posted_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="hover:border-primary/50 transition-colors group">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={job.company_logo_url || ''} alt={job.company_name || ''} />
            <AvatarFallback className="bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                  <Link href={`/jobs/${job.id}`} className="hover:underline">
                    {job.job_title}
                  </Link>
                </h3>
                {job.company_name && (
                  <p className="text-sm text-muted-foreground mt-1">{job.company_name}</p>
                )}
              </div>
              {showSaveButton && (
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Bookmark className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary" className={platformColors[job.platform] || 'bg-gray-100'}>
                {platformLabels[job.platform] || job.platform}
              </Badge>
              {job.job_type && (
                <Badge variant="secondary" className={jobTypeColors[job.job_type] || 'bg-gray-100'}>
                  {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                </Badge>
              )}
              {job.employment_type && (
                <Badge variant="secondary">{job.employment_type}</Badge>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
              )}
              {daysAgo !== null && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>
                </div>
              )}
            </div>

            {/* Salary */}
            {job.salary_range && (
              <p className="text-sm font-medium text-green-600 mt-2">{job.salary_range}</p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 pt-0">
        <Link href={`/jobs/${job.id}`} className="w-full">
          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            View Details
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

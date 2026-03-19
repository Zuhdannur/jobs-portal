'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import {
  Briefcase,
  Bookmark,
  CheckCircle,
  Clock,
  XCircle,
  User,
  TrendingUp,
  ArrowRight,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase/client';

interface DashboardStats {
  totalSaved: number;
  applied: number;
  interviewing: number;
  rejected: number;
  accepted: number;
  saved: number;
}

interface RecentJob {
  id: string;
  job_title: string;
  company_name: string | null;
  status: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_locations: string[];
  preferred_job_types: string[];
}

const statusColors: Record<string, string> = {
  saved: 'bg-gray-100 text-gray-800',
  applied: 'bg-blue-100 text-blue-800',
  interviewing: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  accepted: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  rejected: 'Rejected',
  accepted: 'Accepted',
};


export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSaved: 0,
    applied: 0,
    interviewing: 0,
    rejected: 0,
    accepted: 0,
    saved: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch user profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData as UserProfile);

    // Fetch saved jobs with status
    const { data: savedJobsData } = await supabase
      .from('saved_jobs')
      .select('status')
      .eq('user_id', user.id);

    if (savedJobsData) {
      const counts = {
        totalSaved: savedJobsData.length,
        applied: savedJobsData.filter((j) => j.status === 'applied').length,
        interviewing: savedJobsData.filter((j) => j.status === 'interviewing').length,
        rejected: savedJobsData.filter((j) => j.status === 'rejected').length,
        accepted: savedJobsData.filter((j) => j.status === 'accepted').length,
        saved: savedJobsData.filter((j) => j.status === 'saved').length,
      };
      setStats(counts);
    }

    // Fetch recent jobs
    const { data: recentData } = await supabase
      .from('saved_jobs')
      .select(`
        id,
        status,
        created_at,
        jobs (
          job_title,
          company_name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentData) {
      setRecentJobs((recentData as unknown as Array<{id: string; status: string; created_at: string; jobs?: {job_title?: string; company_name?: string}}>).map((item) => ({
        id: item.id,
        job_title: item.jobs?.job_title || 'Unknown',
        company_name: item.jobs?.company_name ?? null,
        status: item.status,
        created_at: item.created_at,
      })));
    }

    setLoading(false);
  };

  const getApplicationRate = () => {
    if (stats.totalSaved === 0) return 0;
    return Math.round(((stats.applied + stats.interviewing + stats.accepted) / stats.totalSaved) * 100);
  };

  const getResponseRate = () => {
    const responded = stats.interviewing + stats.rejected + stats.accepted;
    if (stats.applied === 0) return 0;
    return Math.round((responded / stats.applied) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | Job Portal</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {profile?.full_name || profile?.email?.split('@')[0] || 'User'}!
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/jobs">
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Find Jobs
                </Button>
              </Link>
              <Link href="/saved">
                <Button variant="outline">
                  <Bookmark className="mr-2 h-4 w-4" />
                  View Saved
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats.totalSaved}</p>
                    <p className="text-sm text-muted-foreground">Total Saved</p>
                  </div>
                  <Bookmark className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats.applied}</p>
                    <p className="text-sm text-muted-foreground">Applied</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats.interviewing}</p>
                    <p className="text-sm text-muted-foreground">Interviewing</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats.accepted}</p>
                    <p className="text-sm text-muted-foreground">Accepted</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats.rejected}</p>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Application Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Progress</CardTitle>
                  <CardDescription>Track your job application journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Application Rate */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Application Rate</span>
                      <span className="text-sm text-muted-foreground">{getApplicationRate()}%</span>
                    </div>
                    <Progress value={getApplicationRate()} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.applied + stats.interviewing + stats.accepted} of {stats.totalSaved} jobs applied
                    </p>
                  </div>

                  {/* Response Rate */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Response Rate</span>
                      <span className="text-sm text-muted-foreground">{getResponseRate()}%</span>
                    </div>
                    <Progress value={getResponseRate()} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.interviewing + stats.rejected + stats.accepted} responses from {stats.applied} applications
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Activity</CardTitle>
                    <Link href="/saved">
                      <Button variant="ghost" size="sm">
                        View All
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No saved jobs yet</p>
                      <Link href="/jobs">
                        <Button variant="outline" className="mt-4">
                          Browse Jobs
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentJobs.map((job) => (
                        <div key={job.id} className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{job.job_title}</p>
                            <p className="text-sm text-muted-foreground">{job.company_name}</p>
                          </div>
                          <Badge className={statusColors[job.status]}>
                            {statusLabels[job.status]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{profile?.full_name || 'User'}</p>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                  </div>

                  <Separator />

                  {profile?.preferred_locations && profile.preferred_locations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Preferred Locations</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.preferred_locations.map((loc, i) => (
                          <Badge key={i} variant="secondary">{loc}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile?.preferred_job_types && profile.preferred_job_types.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Preferred Job Types</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.preferred_job_types.map((type, i) => (
                          <Badge key={i} variant="secondary">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/jobs">
                    <Button variant="outline" className="w-full justify-start">
                      <Search className="mr-2 h-4 w-4" />
                      Search Jobs
                    </Button>
                  </Link>
                  <Link href="/saved">
                    <Button variant="outline" className="w-full justify-start">
                      <Bookmark className="mr-2 h-4 w-4" />
                      View Saved Jobs
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

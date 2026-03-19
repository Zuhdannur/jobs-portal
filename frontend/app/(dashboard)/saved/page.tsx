'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Download, Trash2, FileText, Bookmark } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase/client';

interface SavedJob {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  jobs: {
    id: string;
    job_title: string;
    company_name: string | null;
    company_logo_url: string | null;
    location: string | null;
    job_type: string | null;
    platform: string;
    posted_at: string | null;
    source_link: string;
  };
}

const statusOptions = [
  { value: 'saved', label: 'Saved', color: 'bg-gray-100 text-gray-800' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' },
];

const platformLabels: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  yc: 'Y Combinator',
  glints: 'Glints',
  jobstreet: 'JobStreet',
};

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from('saved_jobs')
      .select(`
        id,
        status,
        notes,
        created_at,
        jobs (
          id,
          job_title,
          company_name,
          company_logo_url,
          location,
          job_type,
          platform,
          posted_at,
          source_link
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching saved jobs:', error);
    } else {
      setSavedJobs((data as unknown as SavedJob[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSavedJobs();
  }, [statusFilter]);

  const updateStatus = async (savedJobId: string, newStatus: string) => {
    const { error } = await supabase
      .from('saved_jobs')
      .update({ status: newStatus })
      .eq('id', savedJobId);

    if (error) {
      console.error('Error updating status:', error);
    } else {
      fetchSavedJobs();
    }
  };

  const updateNotes = async (savedJobId: string) => {
    const { error } = await supabase
      .from('saved_jobs')
      .update({ notes })
      .eq('id', savedJobId);

    if (error) {
      console.error('Error updating notes:', error);
    } else {
      fetchSavedJobs();
    }
  };

  const deleteSavedJob = async (savedJobId: string) => {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', savedJobId);

    if (error) {
      console.error('Error deleting saved job:', error);
    } else {
      fetchSavedJobs();
    }
  };

  const exportToCSV = () => {
    const headers = ['Job Title', 'Company', 'Location', 'Platform', 'Status', 'Notes', 'Saved Date'];
    const rows = savedJobs.map((sj) => [
      sj.jobs.job_title,
      sj.jobs.company_name || '',
      sj.jobs.location || '',
      platformLabels[sj.jobs.platform] || sj.jobs.platform,
      sj.status,
      sj.notes || '',
      new Date(sj.created_at).toLocaleDateString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved-jobs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeColor = (status: string) => {
    const option = statusOptions.find((o) => o.value === status);
    return option?.color || 'bg-gray-100';
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find((o) => o.value === status);
    return option?.label || status;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Saved Jobs | Job Portal</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold">Saved Jobs</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            {statusOptions.map((status) => (
              <Card key={status.value} className="cursor-pointer" onClick={() => setStatusFilter(status.value)}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">
                    {savedJobs.filter((sj) => sj.status === status.value).length}
                  </p>
                  <p className="text-sm text-muted-foreground">{status.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statusFilter !== 'all' && (
              <Button variant="ghost" onClick={() => setStatusFilter('all')}>
                Clear Filter
              </Button>
            )}
          </div>

          {/* Saved Jobs List */}
          {savedJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No saved jobs</h3>
                <p className="text-muted-foreground mb-4">
                  Start saving jobs to track your applications.
                </p>
                <Link href="/jobs">
                  <Button>Browse Jobs</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {savedJobs.map((savedJob) => (
                <Card key={savedJob.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={savedJob.jobs.company_logo_url || ''} />
                        <AvatarFallback>
                          {savedJob.jobs.company_name?.[0] || 'J'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/jobs/${savedJob.jobs.id}`}
                              className="font-semibold text-lg hover:text-primary transition-colors"
                            >
                              {savedJob.jobs.job_title}
                            </Link>
                            <p className="text-muted-foreground">
                              {savedJob.jobs.company_name} • {savedJob.jobs.location}
                            </p>
                          </div>
                          <Badge className={getStatusBadgeColor(savedJob.status)}>
                            {getStatusLabel(savedJob.status)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">
                            {platformLabels[savedJob.jobs.platform] || savedJob.jobs.platform}
                          </Badge>
                          {savedJob.jobs.job_type && (
                            <Badge variant="secondary">
                              {savedJob.jobs.job_type}
                            </Badge>
                          )}
                        </div>

                        {savedJob.notes && (
                          <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                            <p className="font-medium text-muted-foreground mb-1">Notes:</p>
                            <p>{savedJob.notes}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4">
                          <Select
                            value={savedJob.status}
                            onValueChange={(value) => updateStatus(savedJob.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setNotes(savedJob.notes || '')}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Notes</DialogTitle>
                                <DialogDescription>
                                  Add or update notes for this job.
                                </DialogDescription>
                              </DialogHeader>
                              <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add your notes here..."
                                rows={5}
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="outline">Cancel</Button>
                                <Button onClick={() => updateNotes(savedJob.id)}>
                                  Save Notes
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <a
                            href={savedJob.jobs.source_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline">View Job</Button>
                          </a>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="text-red-600 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Saved Job</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this job from your saved list?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSavedJob(savedJob.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

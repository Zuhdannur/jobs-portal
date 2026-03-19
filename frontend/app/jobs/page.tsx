'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Briefcase, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { JobCard } from '@/components/job-card';
import { JobCardSkeleton } from '@/components/job-card-skeleton';
import { supabase } from '@/lib/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface Job {
  id: string;
  job_title: string;
  company_name: string | null;
  location: string | null;
  job_type: string | null;
  platform: string;
  posted_at: string | null;
  salary_range: string | null;
  experience_level: string | null;
  employment_type: string | null;
  company_logo_url: string | null;
}

const platforms = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'yc', label: 'Y Combinator' },
  { value: 'glints', label: 'Glints' },
  { value: 'jobstreet', label: 'JobStreet' },
];

const jobTypes = [
  { value: 'remote', label: 'Remote' },
  { value: 'office', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
];

const dateRanges = [
  { value: '24h', label: 'Last 24 hours' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
];

const sortOptions = [
  { value: 'posted_at', label: 'Most Recent' },
  { value: 'job_title', label: 'Job Title' },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [sortBy, setSortBy] = useState('posted_at');

  const ITEMS_PER_PAGE = 10;

  const fetchJobs = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Search
    if (searchQuery) {
      query = query.or(`job_title.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`);
    }

    // Platform filter
    if (selectedPlatforms.length > 0) {
      query = query.in('platform', selectedPlatforms);
    }

    // Job type filter
    if (selectedJobTypes.length > 0) {
      query = query.in('job_type', selectedJobTypes);
    }

    // Date range filter
    if (selectedDateRange) {
      const now = new Date();
      // eslint-disable-next-line prefer-const
      let cutoffDate = new Date();

      switch (selectedDateRange) {
        case '24h':
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setDate(now.getDate() - 30);
          break;
      }

      query = query.gte('posted_at', cutoffDate.toISOString());
    }

    // Sorting
    query = query.order(sortBy, { ascending: false });

    // Pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
    } else {
      setJobs(data as Job[]);
      setTotalCount(count || 0);
    }

    setLoading(false);
  }, [searchQuery, selectedPlatforms, selectedJobTypes, selectedDateRange, sortBy, currentPage]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
    setCurrentPage(1);
  };

  const toggleJobType = (type: string) => {
    setSelectedJobTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedPlatforms([]);
    setSelectedJobTypes([]);
    setSelectedDateRange('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Platform Filter */}
      <div>
        <h3 className="font-semibold mb-3">Platforms</h3>
        <div className="space-y-2">
          {platforms.map((platform) => (
            <div key={platform.value} className="flex items-center space-x-2">
              <Checkbox
                id={`platform-${platform.value}`}
                checked={selectedPlatforms.includes(platform.value)}
                onCheckedChange={() => togglePlatform(platform.value)}
              />
              <Label htmlFor={`platform-${platform.value}`}>{platform.label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Job Type Filter */}
      <div>
        <h3 className="font-semibold mb-3">Job Type</h3>
        <div className="space-y-2">
          {jobTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type.value}`}
                checked={selectedJobTypes.includes(type.value)}
                onCheckedChange={() => toggleJobType(type.value)}
              />
              <Label htmlFor={`type-${type.value}`}>{type.label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div>
        <h3 className="font-semibold mb-3">Date Posted</h3>
        <Select value={selectedDateRange} onValueChange={(value) => { setSelectedDateRange(value); setCurrentPage(1); }}>
          <SelectTrigger>
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            {dateRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      <Button variant="outline" className="w-full" onClick={clearFilters}>
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Button */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {(selectedPlatforms.length + selectedJobTypes.length > 0) && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedPlatforms.length + selectedJobTypes.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Filters</h2>
              </div>
              <FilterContent />
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Search and Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs, companies, or keywords..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <>Found <span className="font-medium text-foreground">{totalCount}</span> jobs</>
              )}
            </p>
          </div>

          {/* Active Filters */}
          {(selectedPlatforms.length > 0 || selectedJobTypes.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedPlatforms.map((platform) => (
                <Badge key={platform} variant="secondary" className="cursor-pointer" onClick={() => togglePlatform(platform)}>
                  {platforms.find((p) => p.value === platform)?.label} ×
                </Badge>
              ))}
              {selectedJobTypes.map((type) => (
                <Badge key={type} variant="secondary" className="cursor-pointer" onClick={() => toggleJobType(type)}>
                  {jobTypes.find((t) => t.value === type)?.label} ×
                </Badge>
              ))}
            </div>
          )}

          {/* Job List */}
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <JobCardSkeleton key={i} />)
            ) : jobs.length > 0 ? (
              jobs.map((job) => <JobCard key={job.id} job={job} />)
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filters to find more results.
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

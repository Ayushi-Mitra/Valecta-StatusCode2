"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  SortAsc,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  User,
  Bell,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { account, databases } from "../../appwrite";
import { toast } from "react-toastify";

// Appwrite configuration - same as employer dashboard
const DATABASE_ID = "68a2abe20039e89a5206";
const JOBS_COLLECTION_ID = "68a2abf80026662f7326";

interface JobPosting {
  $id: string;
  role: string;
  description: string;
  location: string;
  jobType: string;
  salary: string;
  experienceLevel: string;
  skills: string[];
  companyName: string;
  employerName: string;
  employerId: string;
  status: string;
  postedDate: string;
  applicationsCount: number;
  additionalRequirements?: string;
}

export default function CandidateJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: "all",
    jobType: "all",
    salaryRange: "all",
    experienceLevel: "all",
    sortBy: "recent",
  });

  // Fetch all active job postings
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          JOBS_COLLECTION_ID,
          [
            // Add any queries here if needed, e.g., to filter only active jobs
            // Query.equal('status', 'active') - depending on your Appwrite version
          ]
        );

        // Safely convert documents to JobPosting type with proper validation
        const validJobs = response.documents
          .map((doc) => doc as unknown as JobPosting)
          .filter((jobDoc: JobPosting) => jobDoc.status === "active");

        setJobs(validJobs);
        setFilteredJobs(validJobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast.error("Failed to load job postings");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Filter and search jobs
  useEffect(() => {
    let filteredResults = jobs.filter((jobItem) => {
      // Search filter
      const matchesSearch =
        jobItem.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        jobItem.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        jobItem.skills.some((skill) =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        jobItem.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Location filter
      const matchesLocation =
        filters.location === "all" ||
        jobItem.location
          .toLowerCase()
          .includes(filters.location.toLowerCase()) ||
        (filters.location === "remote" &&
          jobItem.location.toLowerCase().includes("remote"));

      // Job type filter
      const matchesJobType =
        filters.jobType === "all" ||
        jobItem.jobType.toLowerCase().includes(filters.jobType.toLowerCase());

      // Experience level filter
      const matchesExperience =
        filters.experienceLevel === "all" ||
        jobItem.experienceLevel
          .toLowerCase()
          .includes(filters.experienceLevel.toLowerCase());

      // Salary range filter (basic implementation)
      let matchesSalary = true;
      if (filters.salaryRange !== "all") {
        const salaryText = jobItem.salary.toLowerCase();
        switch (filters.salaryRange) {
          case "50-80":
            matchesSalary =
              salaryText.includes("50") ||
              salaryText.includes("60") ||
              salaryText.includes("70") ||
              salaryText.includes("80");
            break;
          case "80-120":
            matchesSalary =
              salaryText.includes("80") ||
              salaryText.includes("90") ||
              salaryText.includes("100") ||
              salaryText.includes("110") ||
              salaryText.includes("120");
            break;
          case "120-160":
            matchesSalary =
              salaryText.includes("120") ||
              salaryText.includes("130") ||
              salaryText.includes("140") ||
              salaryText.includes("150") ||
              salaryText.includes("160");
            break;
          case "160+":
            matchesSalary =
              salaryText.includes("160") ||
              salaryText.includes("170") ||
              salaryText.includes("180") ||
              salaryText.includes("190") ||
              salaryText.includes("200");
            break;
        }
      }

      return (
        matchesSearch &&
        matchesLocation &&
        matchesJobType &&
        matchesExperience &&
        matchesSalary
      );
    });

    // Sort jobs
    switch (filters.sortBy) {
      case "recent":
        filteredResults = filteredResults.sort(
          (a, b) =>
            new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
        );
        break;
      case "salary":
        // Basic salary sorting - you might want to improve this
        filteredResults = filteredResults.sort((a, b) =>
          b.salary.localeCompare(a.salary)
        );
        break;
      case "applications":
        filteredResults = filteredResults.sort(
          (a, b) => b.applicationsCount - a.applicationsCount
        );
        break;
      case "match":
        // For now, sort by most recent as we don't have match scores
        filteredResults = filteredResults.sort(
          (a, b) =>
            new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
        );
        break;
    }

    setFilteredJobs(filteredResults);
  }, [jobs, searchQuery, filters]);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
    } catch {}
    window.location.href = "/";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            Loading available positions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/candidate/dashboard"
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Link
                href="/candidate/dashboard"
                className="flex items-center gap-2"
              >
                <Briefcase className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Valecta</h1>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <User className="h-5 w-5" />
                </Button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-md border border-border bg-card shadow-md">
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-950/30"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search and Filters Sidebar */}
          <div className="lg:w-1/3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Jobs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search by title, company, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex gap-2">
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, sortBy: value }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="applications">Most Applied</SelectItem>
                      <SelectItem value="match">Best Match</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Location
                    </label>
                    <Select
                      value={filters.location}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, location: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="san francisco">
                          San Francisco, CA
                        </SelectItem>
                        <SelectItem value="new york">New York, NY</SelectItem>
                        <SelectItem value="austin">Austin, TX</SelectItem>
                        <SelectItem value="seattle">Seattle, WA</SelectItem>
                        <SelectItem value="boston">Boston, MA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Job Type
                    </label>
                    <Select
                      value={filters.jobType}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, jobType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Salary Range
                    </label>
                    <Select
                      value={filters.salaryRange}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, salaryRange: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select salary range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ranges</SelectItem>
                        <SelectItem value="50-80">₹50k - ₹80k</SelectItem>
                        <SelectItem value="80-120">₹80k - ₹120k</SelectItem>
                        <SelectItem value="120-160">₹120k - ₹160k</SelectItem>
                        <SelectItem value="160+">₹160k+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Experience Level
                    </label>
                    <Select
                      value={filters.experienceLevel}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          experienceLevel: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="lead">Lead/Principal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Listings */}
          <div className="lg:w-2/3 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Available Positions</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredJobs.length} jobs found
                </p>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No jobs found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {jobs.length === 0
                      ? "No job postings are currently available. Check back later!"
                      : "Try adjusting your search criteria or filters."}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear Search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map((jobItem) => {
                  const isRemote = jobItem.location
                    .toLowerCase()
                    .includes("remote");

                  return (
                    <Card
                      key={jobItem.$id}
                      className="hover:shadow-lg transition-shadow cursor-pointer group"
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                {jobItem.role}
                              </h3>
                              {isRemote && (
                                <Badge variant="outline" className="text-xs">
                                  Remote
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground font-medium mb-3">
                              {jobItem.companyName}
                            </p>
                          </div>
                          <Link href={`/candidate/jobs/${jobItem.$id}`}>
                            <Button className="bg-primary hover:bg-primary/90">
                              Apply
                            </Button>
                          </Link>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {jobItem.location || "Not specified"}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-lg">₹</span>
                            {jobItem.salary || "Negotiable"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(jobItem.postedDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {jobItem.jobType}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {jobItem.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {jobItem.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{jobItem.experienceLevel}</span>
                          <div className="flex gap-4">
                            <span>
                              {jobItem.applicationsCount} applications
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Load More - placeholder for pagination */}
            {filteredJobs.length > 0 && filteredJobs.length >= 10 && (
              <div className="text-center pt-6">
                <Button variant="outline" size="lg">
                  Load More Jobs
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

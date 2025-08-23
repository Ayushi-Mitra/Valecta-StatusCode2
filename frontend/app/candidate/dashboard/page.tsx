"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, User, ArrowLeft, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { account, databases } from "../../appwrite";
import { Query } from "appwrite";

// Appwrite configuration
const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "68a2abe20039e89a5206";
const JOBS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_JOBS_COLLECTION_ID || "68a2abf80026662f7326";
const APPLICATIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_APPLICATIONS_COLLECTION_ID || "applications";

interface JobApplication {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  jobId: string;
  userId: string;
  appliedDate: string;
  status: string;
  resumeFileId?: string;
  // Job details fetched from jobs collection
  jobTitle?: string;
  companyName?: string;
  jobExists?: boolean;
}

export default function CandidateDashboard() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    $id: string;
    name?: string;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await account.get();
        setUserName(user.name || "");
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to fetch user", error);
        setUserName("");
      }
    };
    fetchUser();
  }, []);

  // Fetch user's applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);

        // First, try to get applications from an applications collection
        // If it doesn't exist, we'll show a message to create it
        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            APPLICATIONS_COLLECTION_ID,
            [
              // Filter by current user ID using Query helper
              Query.equal("userId", currentUser.$id),
            ]
          );

          console.log("Applications found:", response.documents.length);
          console.log("Applications data:", response.documents);

          // Fetch job details for each application and filter out deleted jobs
          const applicationsWithJobDetails = await Promise.all(
            response.documents.map(async (app) => {
              try {
                const job = await databases.getDocument(
                  DATABASE_ID,
                  JOBS_COLLECTION_ID,
                  app.jobId
                );

                return {
                  ...app,
                  jobTitle: job.role,
                  companyName: job.companyName,
                  jobExists: true,
                };
              } catch (error) {
                console.log(
                  `Job ${app.jobId} not found or deleted. Marking application for filtering.`
                );
                // Mark this application as having a deleted job
                return {
                  ...app,
                  jobExists: false,
                };
              }
            })
          );

          // Filter out applications where the job no longer exists
          const validApplications = applicationsWithJobDetails.filter(
            (app) => app.jobExists
          );
          console.log(
            `Filtering out ${
              applicationsWithJobDetails.length - validApplications.length
            } applications with deleted jobs`
          );

          setApplications(validApplications as unknown as JobApplication[]);
        } catch {
          console.log(
            "Applications collection not found. Showing empty state."
          );
          setApplications([]);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
    } catch {}
    window.location.href = "/";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "interview_scheduled":
        return "bg-blue-600 text-white border-blue-700";
      case "under_review":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "ai_interview_pending":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "hired":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "applied":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "interview_scheduled":
        return "INTERVIEW READY";
      case "under_review":
        return "UNDER REVIEW";
      case "ai_interview_pending":
        return "INTERVIEW PENDING";
      case "hired":
        return "HIRED";
      case "applied":
        return "APPLIED";
      case "rejected":
        return "REJECTED";
      default:
        return "APPLIED";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {userName || "Candidate"}!
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s your job search progress and upcoming activities.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-4 text-foreground/90">
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {" "}
            {/* Changed to 3 columns to accommodate Path Predictor */}
            <div>
              <Link href="/candidate/jobs" className="block">
                <Card className="overflow-hidden h-full border-2 border-transparent hover:border-primary transition-all duration-300">
                  <CardContent className="p-6 relative">
                    <div className="flex items-center gap-6">
                      <div className="bg-primary/10 rounded-full p-4">
                        <Briefcase className="h-10 w-10 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-1 text-foreground">
                          Browse Jobs
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Discover and apply to new opportunities that match
                          your skills
                        </p>
                      </div>
                      <div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-primary/20 text-primary"
                        >
                          <ArrowLeft className="h-5 w-5 rotate-180" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
            
            <div>
              <Link href="/candidate/path-predictor" className="block">
                <Card className="overflow-hidden h-full border-2 border-transparent hover:border-primary transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="p-6 relative">
                    <div className="flex items-center gap-6">
                      <div className="bg-primary/10 rounded-full p-4">
                        <TrendingUp className="h-10 w-10 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-1 text-foreground">
                          Path Predictor
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          AI-powered career guidance and personalized roadmaps
                        </p>
                      </div>
                      <div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-primary/20 text-primary"
                        >
                          <ArrowLeft className="h-5 w-5 rotate-180" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        {/* Application Status */}
        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Your Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-lg">
                    Loading your applications...
                  </p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4 text-lg">
                    No active applications found
                  </p>
                  <p className="text-base text-muted-foreground">
                    {loading
                      ? "Loading your applications..."
                      : "You don't have any active job applications. This could be because you haven't applied to any jobs yet, or the jobs you applied to have been removed by employers."}
                  </p>
                  <Link href="/candidate/jobs">
                    <Button className="mt-4 text-lg px-6 py-2">
                      Browse Jobs
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {applications.map((app) => (
                    <Card
                      key={app.$id}
                      className="relative border border-primary/30 overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-gradient-to-r from-card/80 to-card"
                    >
                      {/* Left border accent */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>

                      {/* Status indicator ribbon */}
                      <div className="absolute top-0 right-0">
                        <Badge
                          className={`px-3 py-0.5 rounded-none rounded-bl-md font-medium text-xs ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {getStatusText(app.status)}
                        </Badge>
                      </div>

                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3 mt-2">
                          <div>
                            <h4 className="font-bold text-2xl text-foreground tracking-tight">
                              {app.jobTitle || "Job Title"}
                            </h4>
                            <p className="text-lg font-semibold text-primary mb-2">
                              {app.companyName || "Company Name"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-secondary/50 border border-border/50 p-2 rounded-md mb-3">
                          <div className="flex items-center gap-3 text-xs text-foreground/80">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-primary/80" />
                              <span>
                                Applied:{" "}
                                {new Date(app.appliedDate).toLocaleDateString()}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-3 py-1 border-primary/30 bg-transparent"
                          >
                            View Details
                          </Button>

                          {app.status === "interview_scheduled" && (
                            <Link
                              href={`/candidate/interview?jobId=${app.jobId}`}
                            >
                              <Button
                                size="sm"
                                className="text-xs font-medium px-3 py-1 bg-blue-600 hover:bg-blue-700"
                              >
                                Start Interview
                              </Button>
                            </Link>
                          )}

                          {app.status === "applied" && (
                            <Button
                              size="sm"
                              className="text-xs font-medium px-3 py-1 bg-gray-500 hover:bg-gray-600"
                              disabled
                            >
                              Processing...
                            </Button>
                          )}

                          {app.status === "rejected" && (
                            <Button
                              size="sm"
                              className="text-xs font-medium px-3 py-1 bg-red-500 hover:bg-red-600"
                              disabled
                            >
                              Not Selected
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

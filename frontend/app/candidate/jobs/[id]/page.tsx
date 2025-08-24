"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  User,
  Building2,
  Users,
  CheckCircle,
  Loader2,
  Bell,
  Upload,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { account, databases, storage, ID } from "../../../appwrite";
import { Query } from "appwrite";
import { toast } from "react-toastify";

// Appwrite configuration
const DATABASE_ID = "68a2abe20039e89a5206";
const JOBS_COLLECTION_ID = "68a2abf80026662f7326";
const APPLICATIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_APPLICATIONS_COLLECTION_ID || "applications";
const STORAGE_BUCKET_ID =
  process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || "resumes";

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

interface AppwriteUser {
  $id: string;
  email: string;
  name?: string;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppwriteUser | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await account.get();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error getting current user:", error);
        router.push("/login");
      }
    };

    getCurrentUser();
  }, [router]);

  // Fetch job details
  useEffect(() => {
    // Check if user has already applied for this job
    const checkIfApplied = async () => {
      if (!currentUser || !jobId) return;

      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          APPLICATIONS_COLLECTION_ID,
          [Query.equal("userId", currentUser.$id), Query.equal("jobId", jobId)]
        );

        setHasApplied(response.documents.length > 0);
      } catch (error) {
        console.error("Error checking application status:", error);
        setHasApplied(false);
      }
    };

    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        setLoading(true);

        const jobDoc = await databases.getDocument(
          DATABASE_ID,
          JOBS_COLLECTION_ID,
          jobId
        );

        const jobData = jobDoc as unknown as JobPosting;
        setJob(jobData);

        // Check if user has already applied
        await checkIfApplied();
      } catch (error) {
        console.error("Error fetching job details:", error);
        toast.error("Failed to load job details");
        router.push("/candidate/jobs");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchJobDetails();
    }
  }, [jobId, currentUser, router]);

  const handleFileSelect = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, DOC, or DOCX file");
      return;
    }

    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleApply = () => {
    setShowApplicationForm(true);
  };

  const handleSubmitApplication = async () => {
    if (!job || !currentUser) return;

    if (!selectedFile) {
      toast.error("Please upload your resume");
      return;
    }

    let fileId: string | undefined;
    let applicationId: string | undefined;

    try {
      setApplying(true);
      toast.info("Processing your application...", {
        autoClose: false,
        toastId: "processing-app",
      });

      // Upload resume file to Appwrite Storage
      fileId = ID.unique();
      await storage.createFile(STORAGE_BUCKET_ID, fileId, selectedFile);

      // Generate the resume URL
      const resumeUrl = storage.getFileView(STORAGE_BUCKET_ID, fileId);

      // Create application record with just the URL
      applicationId = ID.unique();
      await databases.createDocument(
        DATABASE_ID,
        APPLICATIONS_COLLECTION_ID,
        applicationId,
        {
          jobId: jobId,
          userId: currentUser.$id,
          appliedDate: new Date().toISOString(),
          status: "applied",
          resumeField: resumeUrl.toString(), // Store only the resume URL
          // Add any other fields you might need
          // candidateName: currentUser.name || currentUser.email,
          // candidateEmail: currentUser.email,
          // jobTitle: job.role,
          // companyName: job.companyName,
        }
      );

      // Update job applications count
      await databases.updateDocument(DATABASE_ID, JOBS_COLLECTION_ID, jobId, {
        applicationsCount: job.applicationsCount + 1,
      });

      // Update local state
      setJob((prev) =>
        prev ? { ...prev, applicationsCount: prev.applicationsCount + 1 } : null
      );
      setHasApplied(true);
      setShowApplicationForm(false);

      toast.success("Application submitted successfully!");

      // Start AI evaluation and wait for the result before redirecting
      try {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fetch-resume-job`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: jobId,
            resumeField: resumeUrl.toString(),
          }),
        });

        if (!response.ok) {
          throw new Error("AI evaluation failed");
        }

        const data = await response.json();
        console.log("AI evaluation result:", data);

        // Update application status based on AI evaluation
        // Check if the value field from Flask is "True"
        const newStatus =
          data.value === "True" ? "interview_scheduled" : "rejected";

        if (applicationId) {
          await databases.updateDocument(
            DATABASE_ID,
            APPLICATIONS_COLLECTION_ID,
            applicationId,
            {
              status: newStatus,
            }
          );
          console.log(`Application status updated to ${newStatus}`);

          // Show a success message based on the result
          if (newStatus === "interview_scheduled") {
            toast.success("Great news! You've been selected for an interview.");
          } else {
            toast.info(
              "Thank you for applying. The position wasn't a match this time."
            );
          }
        } else {
          console.error("No application ID available to update status");
        }

        // Navigate to dashboard after status is updated
        router.push("/candidate/dashboard");
      } catch (error) {
        console.error("AI evaluation or status update failed:", error);
        // Still navigate to dashboard even if evaluation fails
        router.push("/candidate/dashboard");
      }
    } catch (error) {
      console.error("Error submitting application:", error);

      // Clean up: Try to delete the uploaded file if document creation failed
      if (fileId) {
        try {
          await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
        } catch (cleanupError) {
          console.error("Failed to cleanup uploaded file:", cleanupError);
        }
      }

      toast.error("Failed to submit application. Please try again.");
    } finally {
      toast.dismiss("processing-app");
      setApplying(false);
    }
  };

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

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFileIcon = () => {
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Job Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
            The job you&#39;re looking for doesn&#39;t exist or has been
            removed.
          </p>
          <Link href="/candidate/jobs">
            <Button>Browse All Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isRemote = job.location.toLowerCase().includes("remote");

  // Application Form Modal
  if (showApplicationForm) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Link
                  href="/candidate/dashboard"
                  className="flex items-center gap-2"
                >
                  <Briefcase className="h-8 w-8 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground">
                    Valecta
                  </h1>
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
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

        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Apply for {job.role}
            </h2>
            <p className="text-muted-foreground">at {job.companyName}</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Upload Your Resume
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Please upload your resume to apply for this position.
                  </p>

                  {/* File Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                  >
                    {selectedFile ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                          {getFileIcon()}
                          <div className="text-left">
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={removeFile}
                            className="ml-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" onClick={removeFile}>
                            Remove
                          </Button>
                          <label className="cursor-pointer">
                            <Button variant="outline" asChild>
                              <span>Replace File</span>
                            </Button>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileInputChange}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <h4 className="text-lg font-medium mb-2">
                            Upload Your Resume
                          </h4>
                          <p className="text-muted-foreground mb-4">
                            Drag and drop your resume here, or click to browse
                          </p>
                        </div>
                        <label className="cursor-pointer">
                          <Button variant="outline" asChild>
                            <span>Choose File</span>
                          </Button>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileInputChange}
                          />
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Supported formats: PDF, DOC, DOCX (Max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="border-t pt-6">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)}
                      id="terms-checkbox"
                    />
                    <div className="text-sm text-muted-foreground">
                      <label htmlFor="terms-checkbox" className="cursor-pointer">
                        <p>
                          I confirm that the information provided is accurate and
                          I agree to the{" "}
                          <button type="button" className="text-primary hover:underline">
                            Terms of Service
                          </button>{" "}
                          and{" "}
                          <button type="button" className="text-primary hover:underline">
                            Privacy Policy
                          </button>
                          .
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-8 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowApplicationForm(false)}
                  className="bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitApplication}
                  disabled={applying || !selectedFile || !agreedToTerms}
                  className="bg-primary hover:bg-primary/90"
                >
                  {applying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
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
                href="/candidate/jobs"
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
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Job Header */}
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-3xl font-bold text-foreground">
                      {job.role}
                    </h1>
                    {isRemote && (
                      <Badge variant="outline" className="text-sm">
                        Remote
                      </Badge>
                    )}
                    <Badge
                      variant={
                        job.status === "active" ? "default" : "secondary"
                      }
                      className="text-sm"
                    >
                      {job.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xl font-semibold text-foreground">
                      {job.companyName}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>{job.jobType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(job.postedDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {hasApplied ? (
                    <Button
                      disabled
                      className="bg-green-600 hover:bg-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Applied
                    </Button>
                  ) : (
                    <Button
                      onClick={handleApply}
                      disabled={job.status !== "active"}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Apply Now
                    </Button>
                  )}

                  <div className="text-xs text-muted-foreground text-center space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{job.applicationsCount} applications</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {job.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Requirements */}
              {job.additionalRequirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {job.additionalRequirements}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Skills Required */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Experience Level
                    </span>
                    <p className="text-foreground">{job.experienceLevel}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Posted Date
                    </span>
                    <p className="text-foreground">
                      {formatFullDate(job.postedDate)}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Job Type
                    </span>
                    <p className="text-foreground">{job.jobType}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Location
                    </span>
                    <p className="text-foreground">{job.location}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle>About the Company</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Company
                    </span>
                    <p className="text-foreground font-semibold">
                      {job.companyName}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Hiring Manager
                    </span>
                    <p className="text-foreground">{job.employerName}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Apply */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Apply</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasApplied ? (
                    <div className="text-center py-4">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        You have successfully applied for this position.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Ready to take the next step in your career?
                      </p>
                      <Button
                        onClick={handleApply}
                        disabled={job.status !== "active"}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        Apply Now
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        By applying, you agree to our terms and conditions.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

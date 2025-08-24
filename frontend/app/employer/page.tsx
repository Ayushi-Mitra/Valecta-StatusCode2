"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { toast } from "react-toastify"
import {
  Briefcase,
  Users,
  Plus,
  MapPin,
  DollarSign,
  Clock,
  Star,
  Edit,
  Trash2,
  LogOut,
  ChevronDown,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { account, databases } from "../appwrite" // adjust path if needed

// Appwrite configuration - use the same IDs as in create page
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const JOBS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_JOBS_COLLECTION_ID!;

interface JobPosting {
  $id: string
  role: string
  description: string
  location: string
  jobType: string
  salary: string
  experienceLevel: string
  skills: string[]
  companyName: string
  employerName: string
  employerId: string
  status: string
  postedDate: string
  applicationsCount: number
  additionalRequirements?: string
}

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState("listings")
  const [employerName, setEmployerName] = useState("Employer")
  const [companyName, setCompanyName] = useState("Your Company")
  const [loading, setLoading] = useState(true)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("Most Recent")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<{ id: string; title: string } | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchEmployerData = async () => {
      try {
        const currentUser = await account.get()
        const prefs = currentUser.prefs || {}
        
        // Set employer name from user data
        setEmployerName(currentUser.name || "Employer")
        
        // Set company name from preferences
        setCompanyName(prefs.company || "Your Company")
        
        // Fetch job postings
        await fetchJobPostings(currentUser.$id)
      } catch (error) {
        console.error("Error fetching employer data:", error)
        // If there's an error, redirect to auth page
        window.location.href = "/auth"
      } finally {
        setLoading(false)
      }
    }

    fetchEmployerData()
  }, [])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchJobPostings = async (userId: string) => {
    try {
      // Query to get jobs posted by this employer
      const response = await databases.listDocuments(
        DATABASE_ID,
        JOBS_COLLECTION_ID,
        [
          // Filter by employerId
          // Note: You might need to adjust this query syntax based on your Appwrite version
          // For newer versions, you might use Query.equal('employerId', userId)
        ]
      )

      // Filter jobs by employerId on client side if server-side filtering doesn't work
      const employerJobs = response.documents
        .map((doc) => doc as unknown as JobPosting)
        .filter((job: JobPosting) => job.employerId === userId)

      setJobPostings(employerJobs)
      setFilteredJobs(employerJobs)
    } catch (error) {
      console.error("Error fetching job postings:", error)
      toast.error("Failed to load job postings")
    }
  }

  // Filter and sort jobs based on search and sort criteria
  useEffect(() => {
    let filtered = jobPostings.filter((job) =>
      job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Sort jobs
    switch (sortBy) {
      case "Most Recent":
        filtered = filtered.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
        break
      case "Most Applications":
        filtered = filtered.sort((a, b) => b.applicationsCount - a.applicationsCount)
        break
      case "Expiring Soon":
        // For this demo, we'll just use posted date as a proxy
        filtered = filtered.sort((a, b) => new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime())
        break
    }

    setFilteredJobs(filtered)
  }, [jobPostings, searchTerm, sortBy])

  const handleApproveInterview = (candidateName: string) => {
    toast.success(`${candidateName} has been approved for AI interview!`, {
      position: "top-right",
      autoClose: 3000,
    })
  }

  const handleHireCandidate = (candidateName: string) => {
    toast.success(`${candidateName} has been hired successfully!`, {
      position: "top-right",
      autoClose: 3000,
    })
  }

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, JOBS_COLLECTION_ID, jobId)
      setJobPostings(jobPostings.filter(job => job.$id !== jobId))
      toast.success("Job posting deleted successfully!")
    } catch (error) {
      console.error("Error deleting job:", error)
      toast.error("Failed to delete job posting")
    } finally {
      setJobToDelete(null)
    }
  }

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
    } catch {}
    window.location.href = "/";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  // Calculate stats from actual job postings
  const stats = {
    activeJobs: jobPostings.filter(job => job.status === "active").length,
    totalApplications: jobPostings.reduce((sum, job) => sum + job.applicationsCount, 0),
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/employer" className="flex items-center gap-2">
                <Briefcase className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">Valecta</span>
              </Link>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Employer
              </Badge>
            </div>
            <div className="flex items-center gap-4">

              
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback>{getInitials(employerName)}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-3 border-b border-border">
                      <p className="font-medium text-foreground">{employerName}</p>
                      <p className="text-sm text-muted-foreground">{companyName}</p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Welcome, {employerName}!</h1>
              <p className="text-muted-foreground">Manage your job postings and candidates</p>
            </div>
            <Link href="/employer/jobs/create">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create a Job
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          {/* Stats Cards removed: Active Jobs and Total Applications */}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <div>
              {/* Job Listings - now full width */}
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-2">{companyName} - My Job Listings</h2>
                  <p className="text-muted-foreground">
                    {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                {filteredJobs.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No job postings found</h3>
                      <p className="text-muted-foreground mb-4">
                        {jobPostings.length === 0 
                          ? "You haven't created any job postings yet." 
                          : "No jobs match your current search criteria."}
                      </p>
                      {jobPostings.length === 0 && (
                        <Link href="/employer/jobs/create">
                          <Button className="bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Job
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <Card key={job.$id} className="relative border border-primary/30 overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-gradient-to-r from-card/80 to-card">
                        {/* Status indicator ribbon */}
                        <div className="absolute top-0 right-0">
                          <Badge 
                            variant="secondary" 
                            className={`px-4 py-1 rounded-none rounded-bl-md font-medium text-xs ${
                              job.status === "active" 
                                ? "bg-green-500/20 text-green-400 border-l border-b border-green-500/30" 
                                : "bg-gray-500/20 text-gray-400 border-l border-b border-gray-500/30"
                            }`}
                          >
                            {job.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {/* Left border accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                        
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-bold text-foreground tracking-tight">{job.role}</h3>
                              </div>
                              <p className="text-base font-medium text-primary/90 mb-4">{job.companyName}</p>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4 p-3 rounded-md bg-secondary/50 border border-border/50">
                                <span className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-primary/80" />
                                  <span className="text-foreground/80">{job.location || "Not specified"}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-primary/80" />
                                  <span className="text-foreground/80">{job.salary || "Negotiable"}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-primary/80" />
                                  <span className="text-foreground/80">{formatDate(job.postedDate)}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-primary/80" />
                                  <span className="text-foreground/80">{job.applicationsCount} applications</span>
                                </span>
                              </div>
                              
                              <div className="bg-card/90 p-3 rounded-md border border-border/50 mb-4">
                                <p className="text-sm text-foreground/80 line-clamp-2">
                                  {job.description}
                                </p>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-1">
                                {job.skills.map((skill) => (
                                  <Badge key={skill} variant="outline" className="bg-primary/10 text-primary/90 border-primary/30 py-1 px-2">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-3 ml-4">
                              <div className="flex gap-2 mt-1">
                                <Link href={`/employer/jobs/${job.$id}/edit`}>
                                  <Button size="sm" variant="outline" className="border-primary/30 hover:bg-primary/10 hover:text-primary">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </Link>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                                  onClick={() => setJobToDelete({ id: job.$id, title: job.role })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant={job.status === "active" ? "secondary" : "outline"}
                                className={job.status === "active" ? "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200" : "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"}
                                onClick={async () => {
                                  try {
                                    await databases.updateDocument(
                                      DATABASE_ID,
                                      JOBS_COLLECTION_ID,
                                      job.$id,
                                      { status: job.status === "active" ? "done" : "active" }
                                    );
                                    setJobPostings((prev) => prev.map(j => j.$id === job.$id ? { ...j, status: j.status === "active" ? "done" : "active" } : j));
                                    toast.success(`Job marked as ${job.status === "active" ? "done" : "active"}`);
                                  } catch (err) {
                                    toast.error("Failed to update job status");
                                  }
                                }}
                              >
                                {job.status === "active" ? "Mark as done" : "Make active"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <div className="space-y-8">

              {/* Score of Candidates */}
              <Card>
                <CardHeader>
                  <CardTitle>Score of Candidates</CardTitle>
                  <p className="text-muted-foreground">Review AI-scored candidates and make hiring decisions</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { name: "Sarah Chen", score: 95, role: "Frontend Developer" },
                      { name: "Mike Johnson", score: 88, role: "AI/ML Engineer" },
                      { name: "Emily Davis", score: 92, role: "Backend Developer" },
                    ].map((candidate, i) => (
                      <Card key={i} className="border-2">
                        <CardContent className="p-6">
                          <div className="text-center mb-4">
                            <Avatar className="h-16 w-16 mx-auto mb-3">
                              <AvatarImage
                                src={`/abstract-geometric-shapes.png?height=64&width=64&query=${candidate.name}`}
                              />
                              <AvatarFallback>
                                {candidate.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{candidate.role}</p>
                            <div className="flex items-center justify-center gap-1 mb-3">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{candidate.score}% Match</span>
                            </div>
                          </div>
                          <Button
                            className="w-full bg-primary hover:bg-primary/90"
                            onClick={() => handleHireCandidate(candidate.name)}
                          >
                            Hire
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={jobToDelete !== null} onOpenChange={(open: boolean) => !open && setJobToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <div className="pt-3">
              <DialogDescription>
                Are you sure you want to delete <span className="font-semibold">"{jobToDelete?.title}"</span>?
              </DialogDescription>
              <div className="mt-2 text-destructive/80">This action cannot be undone.</div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setJobToDelete(null)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => jobToDelete && handleDeleteJob(jobToDelete.id, jobToDelete.title)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
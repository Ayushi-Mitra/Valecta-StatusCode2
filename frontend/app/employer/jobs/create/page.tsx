"use client"
//create/page.tsx
import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "react-toastify"
import { Briefcase, MapPin, DollarSign, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { account, databases, ID } from "../../../appwrite" // adjust path if needed

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const JOBS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_JOBS_COLLECTION_ID!;

export default function CreateJobPage() {
  const [formData, setFormData] = useState({
    role: "",
    description: "",
    location: "",
    jobType: "Full-time",
    salary: "",
    experienceLevel: "Entry Level (0-2 years)",
    additionalRequirements: "",
  })
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [loading, setLoading] = useState(false)
  const [employerData, setEmployerData] = useState({
    name: "",
    company: "",
    userId: "",
  })

  // Fetch employer data on component mount
  useEffect(() => {
    const fetchEmployerData = async () => {
      try {
        const currentUser = await account.get()
        const prefs = currentUser.prefs || {}
        
        setEmployerData({
          name: currentUser.name || "Employer",
          company: prefs.company || "Your Company",
          userId: currentUser.$id,
        })
      } catch (error) {
        console.error("Error fetching employer data:", error)
        toast.error("Please log in to create a job posting")
        window.location.href = "/auth"
      }
    }

    fetchEmployerData()
  }, [])

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePostJob = async () => {
    // Basic validation
    if (!formData.role.trim()) {
      toast.error("Please enter a job role")
      return
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a job description")
      return
    }

    setLoading(true)
    
    try {
      // Prepare job data for Appwrite
      const jobData = {
        role: formData.role.trim(),
        description: formData.description.trim(),
        location: formData.location.trim() || "Not specified",
        jobType: formData.jobType,
        salary: formData.salary.trim() || "Negotiable",
        experienceLevel: formData.experienceLevel,
        additionalRequirements: formData.additionalRequirements.trim(),
        skills: skills,
        
        // Employer information
        employerId: employerData.userId,
        employerName: employerData.name,
        companyName: employerData.company,
        
        // Metadata
        status: "active",
        postedDate: new Date().toISOString(),
        applicationsCount: 0,
      }

      // Save to Appwrite database
      const response = await databases.createDocument(
        DATABASE_ID,
        JOBS_COLLECTION_ID,
        ID.unique(),
        jobData
      )

      console.log("Job created successfully:", response)
      
      toast.success(`${formData.role} has been posted successfully!`, {
        position: "top-right",
        autoClose: 3000,
      })

      // Redirect to employer dashboard after successful creation
      setTimeout(() => {
        window.location.href = "/employer"
      }, 2000)

    } catch (error) {
      console.error("Error creating job:", error)
      toast.error("Failed to create job posting. Please try again.")
    } finally {
      setLoading(false)
    }
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
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create a New Job</h1>
            <p className="text-muted-foreground">
              Posting as: <strong>{employerData.company}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Role/Position *</label>
                    <Input
                      placeholder="e.g. Senior Frontend Developer"
                      value={formData.role}
                      onChange={(e) => handleInputChange("role", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Job Description *</label>
                    <Textarea
                      placeholder="Describe the role and responsibilities..."
                      className="min-h-[120px]"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Location</label>
                      <Input
                        placeholder="e.g. San Francisco, CA"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Job Type</label>
                      <select
                        className="w-full px-3 py-2 bg-background border border-border rounded-md"
                        value={formData.jobType}
                        onChange={(e) => handleInputChange("jobType", e.target.value)}
                      >
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Internship</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Salary Expectation</label>
                    <Input
                      placeholder="e.g. ₹120k - ₹160k"
                      value={formData.salary}
                      onChange={(e) => handleInputChange("salary", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skills & Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Skills Needed</label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="e.g. React, TypeScript, Node.js"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addSkill()}
                      />
                      <Button onClick={addSkill} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Experience Level</label>
                    <select
                      className="w-full px-3 py-2 bg-background border border-border rounded-md"
                      value={formData.experienceLevel}
                      onChange={(e) => handleInputChange("experienceLevel", e.target.value)}
                    >
                      <option>Entry Level (0-2 years)</option>
                      <option>Mid Level (2-5 years)</option>
                      <option>Senior Level (5+ years)</option>
                      <option>Lead/Principal (8+ years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Additional Requirements
                    </label>
                    <Textarea
                      placeholder="Any additional requirements or qualifications..."
                      className="min-h-[80px]"
                      value={formData.additionalRequirements}
                      onChange={(e) => handleInputChange("additionalRequirements", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Link href="/employer">
                  <Button variant="outline" disabled={loading}>Cancel</Button>
                </Link>
                <Button 
                  className="bg-primary hover:bg-primary/90" 
                  onClick={handlePostJob}
                  disabled={loading}
                >
                  {loading ? "Posting..." : "Post Job"}
                </Button>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Job Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {formData.role || "Senior Frontend Developer"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {employerData.company || "Your Company"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {formData.location || "San Francisco, CA"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="text-lg">₹</span>
                        {formData.salary || "₹120k - ₹160k"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formData.jobType}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {formData.description ||
                          "Join our innovative team building cutting-edge web applications with modern technologies..."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {skills.length > 0 ? (
                        skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <>
                          <Badge variant="outline" className="text-xs">
                            React
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            TypeScript
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Node.js
                          </Badge>
                        </>
                      )}
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90" disabled>
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
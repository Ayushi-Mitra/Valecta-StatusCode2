"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    salary: "",
    type: "",
    description: "",
    requirements: "",
    skills: "",
  })

  // Load existing job data
  useEffect(() => {
    // Mock data based on job ID
    const mockJobs = {
      "1": {
        title: "Senior Frontend Developer",
        location: "San Francisco, CA",
        salary: "$120k - $160k",
        type: "Full-time",
        description:
          "Join our innovative team building cutting-edge web applications with modern technologies. You'll work on challenging projects that impact millions of users worldwide.",
        requirements:
          "5+ years of experience in frontend development, Strong knowledge of React and TypeScript, Experience with modern build tools and CI/CD",
        skills: "React, TypeScript, Next.js",
      },
      "2": {
        title: "AI/ML Engineer",
        location: "Remote",
        salary: "$140k - $180k",
        type: "Full-time",
        description:
          "Build next-generation AI systems that power our platform. Work with cutting-edge machine learning technologies and contribute to groundbreaking AI research.",
        requirements:
          "PhD or Masters in Computer Science/AI, 3+ years of ML experience, Strong Python and deep learning frameworks knowledge",
        skills: "Python, TensorFlow, PyTorch",
      },
    }

    const jobData = mockJobs[jobId as keyof typeof mockJobs]
    if (jobData) {
      setFormData(jobData)
    }
  }, [jobId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveJob = () => {
    toast.success("Job updated successfully!", {
      position: "top-right",
      autoClose: 3000,
    })

    // Redirect back to employer dashboard after a short delay
    setTimeout(() => {
      router.push("/employer")
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/employer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <Briefcase className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">Valecta</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Edit Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Edit Job Posting</CardTitle>
                <p className="text-muted-foreground">Update your job details and see changes in real-time</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Job Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g. Senior Frontend Developer"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g. San Francisco, CA or Remote"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Salary Range</label>
                  <Input
                    value={formData.salary}
                    onChange={(e) => handleInputChange("salary", e.target.value)}
                    placeholder="e.g. $120k - $160k"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Job Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select job type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Job Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe the role and responsibilities..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Requirements</label>
                  <Textarea
                    value={formData.requirements}
                    onChange={(e) => handleInputChange("requirements", e.target.value)}
                    placeholder="List the key requirements and qualifications..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Skills Needed</label>
                  <Input
                    value={formData.skills}
                    onChange={(e) => handleInputChange("skills", e.target.value)}
                    placeholder="e.g. React, TypeScript, Node.js (comma separated)"
                  />
                </div>

                <Button onClick={handleSaveJob} className="w-full bg-primary hover:bg-primary/90">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <p className="text-muted-foreground">See how your job posting will appear to candidates</p>
              </CardHeader>
              <CardContent>
                <Card className="border-2 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{formData.title || "Job Title"}</h3>
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                            Active
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">TechCorp Inc.</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {formData.location || "Location"}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formData.salary || "Salary Range"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formData.type || "Job Type"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {formData.description || "Job description will appear here..."}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {formData.skills
                            .split(",")
                            .filter((skill) => skill.trim())
                            .map((skill, index) => (
                              <Badge key={index} variant="outline">
                                {skill.trim()}
                              </Badge>
                            ))}
                        </div>
                        {formData.requirements && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Requirements:</strong>
                            <p className="mt-1">{formData.requirements}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>24 applications</span>
                        </div>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

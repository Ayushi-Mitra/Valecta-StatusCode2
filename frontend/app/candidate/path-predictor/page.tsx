"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Upload,
  FileText,
  TrendingUp,
  Target,
  MapPin,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Brain,
  Lightbulb,
  Star,
  Orbit,
  Network,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface CareerPath {
  title: string
  fit_explanation: string
  roadmap: {
    immediate_steps: string[]
    long_term_steps: string[]
  }
  match_percentage: number
  salary_range: string
  growth_potential: string
  icon: string
  color: string
  x: number
  y: number
  skills: string[]
}

interface ApiValue {
  recommendations: {
    career_path: string
    why_it_fits: string
    roadmap: {
      immediate_steps: string | string[]
      long_term: string | string[]
      skills_to_learn: string | string[]
      certifications: string | string[]
    }
  }[]
  cross_industry_opportunities: string
}

export default function PathPredictor() {
  const [step, setStep] = useState<"upload" | "analyzing" | "results">("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [selectedPath, setSelectedPath] = useState<number | null>(null)
  const [hoveredPath, setHoveredPath] = useState<number | null>(null)
  const [showRoadmap, setShowRoadmap] = useState<number | null>(null)
  const [animationPhase, setAnimationPhase] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([])
  const [crossIndustry, setCrossIndustry] = useState<string>("")

  const icons = ["🎯", "📊", "⚡", "🚀", "🌟", "🔗", "💡", "🛠️", "🎉", "🎊"]
  const colors = [
    "from-emerald-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-purple-400 to-pink-500",
    "from-yellow-400 to-orange-500",
    "from-red-400 to-rose-500",
    "from-cyan-400 to-blue-500",
    "from-green-400 to-teal-500",
    "from-pink-400 to-purple-500",
    "from-orange-400 to-red-500",
    "from-gray-400 to-slate-500",
  ]

  useEffect(() => {
    if (step === "results") {
      const interval = setInterval(() => {
        setAnimationPhase((prev) => (prev + 1) % 4)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [step])

  // Debug logging for roadmap state
  useEffect(() => {
    console.log("Roadmap state changed:", { showRoadmap, selectedPath, careerPathsLength: careerPaths.length })
  }, [showRoadmap, selectedPath, careerPaths])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setError(null)
    }
  }

  const mapApiToCareerPaths = (value: ApiValue): CareerPath[] => {
    const recs = value?.recommendations || []
    const mapped: CareerPath[] = recs.map((rec, index) => {
      const roadmap = rec.roadmap || {}

      const immediateRaw = roadmap.immediate_steps || ""
      const longTermRaw = roadmap.long_term || ""

      const toArray = (v: string | string[] | undefined): string[] => {
        if (!v) return []
        if (Array.isArray(v)) return v.filter(Boolean)
        // split by period, newline, or bullet points - also handle sentences
        return v
          .split(/(?:\n|\r|\u2022|-|\.|;)+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 10) // Filter out very short fragments
          .slice(0, 3) // Limit to max 3 steps per section
      }

      // Ensure we have at least one meaningful step for each roadmap section
      const immediateSteps = toArray(immediateRaw)
      const longTermSteps = toArray(longTermRaw)

      // If no steps found or steps are too short, provide meaningful defaults
      if (immediateSteps.length === 0 || immediateSteps.every((step) => step.length < 15)) {
        immediateSteps.length = 0 // Clear short steps
        immediateSteps.push(
          "Enhance relevant skills through online courses and practice projects",
          "Build a professional network in your target industry",
          "Update your resume and LinkedIn profile to highlight relevant experience",
        )
      }

      if (longTermSteps.length === 0 || longTermSteps.every((step) => step.length < 15)) {
        longTermSteps.length = 0 // Clear short steps
        longTermSteps.push(
          "Pursue leadership opportunities and mentor others in your field",
          "Consider advanced certifications or specialized training",
          "Develop strategic thinking and business acumen for senior roles",
        )
      }

      // Generate position and visual properties
      const x = 20 + ((index * 23) % 60)
      const y = 25 + ((index * 31) % 50)

      // Generate skills array from roadmap
      const skillsRaw = roadmap.skills_to_learn || roadmap.certifications || ""
      const skillsArray = toArray(skillsRaw).slice(0, 4)

      // If no skills extracted, create some based on the career path title
      const defaultSkills = rec.career_path.toLowerCase().includes("data")
        ? ["Data Analysis", "SQL", "Python", "Visualization"]
        : rec.career_path.toLowerCase().includes("develop")
          ? ["Programming", "Problem Solving", "Testing", "Collaboration"]
          : rec.career_path.toLowerCase().includes("manage")
            ? ["Leadership", "Communication", "Planning", "Strategy"]
            : ["Communication", "Problem Solving", "Analysis", "Collaboration"]

      return {
        title: rec.career_path || `Career Path ${index + 1}`,
        fit_explanation:
          rec.why_it_fits || "This career path aligns well with your background and offers good growth potential.",
        roadmap: {
          immediate_steps: immediateSteps,
          long_term_steps: longTermSteps,
        },
        match_percentage: Math.max(60, 70 + ((index * 7) % 25)), // Ensure minimum 60% match
        salary_range: "Competitive salary based on experience and location",
        growth_potential: "High",
        icon: icons[index % icons.length],
        color: colors[index % colors.length],
        x,
        y,
        skills: skillsArray.length > 0 ? skillsArray : defaultSkills,
      }
    })
    return mapped
  }

  const handleAnalyze = async () => {
    if (!uploadedFile) return
    setError(null)
    setStep("analyzing")
    setAnalysisProgress(0)

    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) return 95
        return prev + Math.random() * 12
      })
    }, 250)

    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const res = await fetch("/api/path-predict", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errData.error || errData.details || "Failed to get prediction")
      }

      const data = await res.json()
      console.log("=== API RESPONSE DEBUG ===")
      console.log("Full API response:", data)
      console.log("Data.value type:", typeof data?.value)
      console.log("Data.message:", data?.message)
      console.log("=== END API RESPONSE DEBUG ===")

      let value: ApiValue | null = null

      // Handle the structured API response
      if (data?.value && typeof data.value === "object") {
        // The backend now returns structured data directly
        console.log("Received structured data from backend")
        value = data.value as ApiValue
      } else if (data?.value && typeof data.value === "string") {
        // Fallback: try to parse string response
        console.log("Attempting to parse string response as fallback")
        try {
          value = JSON.parse(data.value) as ApiValue
        } catch (e) {
          console.warn("Failed to parse string response:", e)
          value = extractFromRawText(data.value)
        }
      } else {
        console.warn("No valid data.value found in response")
        throw new Error("No career path data received from AI service")
      }

      console.log("Final parsed value:", value)

      if (!value || !value.recommendations || value.recommendations.length === 0) {
        throw new Error(
          "No valid career recommendations found. Please try uploading a different resume or ensure it contains clear skill information.",
        )
      }

      console.log("Using AI-generated recommendations:", value.recommendations.length, "paths found")

      const mapped = mapApiToCareerPaths(value)
      setCareerPaths(mapped)
      setCrossIndustry(
        value.cross_industry_opportunities ||
          "Your skills provide opportunities across multiple sectors based on your experience.",
      )
      setAnalysisProgress(100)
      clearInterval(progressInterval)
      setTimeout(() => setStep("results"), 300)
    } catch (e) {
      clearInterval(progressInterval)
      console.error("Analysis error:", e)
      setError((e as Error).message || "An unexpected error occurred during analysis")
      setStep("upload")
    }
  }

  // Removed fallback data. Show error if backend response is invalid.

  // Extract structured data from raw AI text response
  const extractFromRawText = (rawText: string): ApiValue => {
    try {
      console.log("Extracting from raw text:", rawText.substring(0, 500) + "...")

      // Try to find JSON-like structures in the text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        console.log("Found JSON-like structure, attempting to parse")
        try {
          return JSON.parse(jsonMatch[0])
        } catch (e) {
          console.warn("Failed to parse extracted JSON structure:", e)
        }
      }

      // Try to extract career paths using various patterns
      const careerPaths: string[] = []
      const explanations: string[] = []
      const roadmaps: any[] = []

      // Pattern 1: Look for numbered lists or bullet points with career paths
      const numberedMatches = rawText.match(
        /\d+\.\s*([^\n\r.]+(?:Engineer|Developer|Manager|Analyst|Consultant|Specialist|Lead|Director|Coordinator|Administrator|Designer|Architect|Scientist|Researcher|Advisor|Expert|Professional|Officer|Representative|Supervisor|Technician|Associate)[^\n\r.]*)/gi,
      )
      if (numberedMatches) {
        careerPaths.push(...numberedMatches.map((match) => match.replace(/^\d+\.\s*/, "").trim()))
      }

      // Pattern 2: Look for lines that contain common job titles
      const jobTitleMatches = rawText.match(
        /(?:^|\n)[^\n\r]*(?:Engineer|Developer|Manager|Analyst|Consultant|Specialist|Lead|Director|Coordinator|Administrator|Designer|Architect|Scientist|Researcher|Advisor|Expert|Professional|Officer|Representative|Supervisor|Technician|Associate)[^\n\r]*/gi,
      )
      if (jobTitleMatches && careerPaths.length === 0) {
        careerPaths.push(...jobTitleMatches.slice(0, 4).map((match) => match.trim().replace(/^[-•*\d+.\s]+/, "")))
      }

      // Pattern 3: Look for "why it fits" or explanation text
      const explanationMatches = rawText.match(
        /(?:why|because|fits|suitable|ideal|perfect|great|excellent|match|align)[^.!?\n\r]*[.!?]/gi,
      )
      if (explanationMatches) {
        explanations.push(...explanationMatches.slice(0, 4))
      }

      // Pattern 4: Look for roadmap-like content
      const stepMatches = rawText.match(
        /(?:step|learn|skill|certif|training|course|develop|improve|build|gain|acquire)[^.!?\n\r]*[.!?]/gi,
      )
      const roadmapSteps = stepMatches ? stepMatches.slice(0, 8) : []

      // If we found career paths, create structured recommendations
      if (careerPaths.length > 0) {
        console.log("Found career paths:", careerPaths)

        const recommendations = careerPaths.slice(0, 4).map((careerPath, index) => {
          const explanation =
            explanations[index] ||
            `Your skills and experience align well with this ${careerPath.toLowerCase()} position.`

          // Split roadmap steps between immediate and long-term
          const immediateSteps = roadmapSteps.slice(index * 2, index * 2 + 2).join(" ")
          const longTermSteps = roadmapSteps.slice(index * 2 + 2, index * 2 + 4).join(" ")

          return {
            career_path: careerPath.trim(),
            why_it_fits: explanation.trim(),
            roadmap: {
              immediate_steps:
                immediateSteps || "Focus on enhancing your current skills and building relevant experience",
              skills_to_learn: "Continue developing technical and soft skills relevant to this field",
              certifications: "Consider industry-relevant certifications to strengthen your credentials",
              long_term:
                longTermSteps ||
                "Progress toward senior roles with increased responsibility and leadership opportunities",
            },
          }
        })

        return {
          recommendations,
          cross_industry_opportunities:
            "Your skills provide diverse opportunities across multiple industries and sectors.",
        }
      }

      // If no clear structure found, try to extract key information and create a general response
      console.log("No clear career path structure found, creating general recommendations")

      // Look for any skills or technologies mentioned
      const skillMatches = rawText.match(
        /(?:Python|Java|JavaScript|React|Node|SQL|AWS|Docker|Kubernetes|Machine Learning|AI|Data|Analysis|Management|Leadership|Communication|Problem Solving|Project Management)[^\s,.]*/gi,
      )
      const skills = skillMatches ? [...new Set(skillMatches.slice(0, 8))] : []

      // Create generic career recommendations based on any detected skills or default to common paths
      const genericPaths =
        skills.length > 0
          ? [
              `${skills[0]} Specialist`,
              `Senior ${skills[0]} Developer`,
              `${skills[0]} Consultant`,
              `Technical Lead - ${skills[0]}`,
            ]
          : ["Software Developer", "Data Analyst", "Project Manager", "Business Analyst"]

      const recommendations = genericPaths.map((path, index) => ({
        career_path: path,
        why_it_fits:
          skills.length > 0
            ? `Your experience with ${skills.slice(0, 3).join(", ")} makes you well-suited for this role.`
            : "Based on your background and the market demand, this career path offers good growth potential.",
        roadmap: {
          immediate_steps: "Focus on skill development, networking, and gaining relevant experience",
          skills_to_learn:
            skills.length > 0
              ? `Deepen your ${skills[0]} skills and learn complementary technologies`
              : "Develop both technical and soft skills",
          certifications: "Consider relevant industry certifications",
          long_term: "Progress toward leadership or specialized expert roles in your chosen field",
        },
      }))

      return {
        recommendations,
        cross_industry_opportunities:
          skills.length > 0
            ? `Your skills in ${skills.slice(0, 3).join(", ")} are valuable across technology, finance, healthcare, and consulting sectors.`
            : "Your professional background provides opportunities across multiple industries.",
      }
    } catch (e) {
      console.warn("Failed to extract from raw text:", e)
      // Fallback to minimal structure
      return {
        recommendations: [
          {
            career_path: "Career Development Opportunity",
            why_it_fits: "Based on your professional background, you have strong potential for career growth.",
            roadmap: {
              immediate_steps: "Focus on identifying and developing your core strengths",
              skills_to_learn: "Continue building both technical and interpersonal skills",
              certifications: "Research relevant industry certifications",
              long_term: "Create a strategic career plan with clear milestones",
            },
          },
        ],
        cross_industry_opportunities:
          "Your professional experience provides a foundation for exploring multiple career paths.",
      }
    }
  }

  const handleStartOver = () => {
    setStep("upload")
    setUploadedFile(null)
    setAnalysisProgress(0)
    setSelectedPath(null)
    setHoveredPath(null)
    setShowRoadmap(null)
    setCareerPaths([])
    setCrossIndustry("")
    setError(null)
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/candidate/dashboard" className="text-slate-400 hover:text-slate-200 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-3 rounded-xl border border-emerald-500/30">
                  <Network className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Career Constellation</h1>
                  <p className="text-sm text-slate-400">Navigate Your Professional Universe</p>
                </div>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-full">
        {step === "upload" && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <div className="relative mb-8">
                <div className="flex items-center justify-center mx-auto mb-6">
                  <Orbit className="h-16 w-16 text-emerald-400" />
                </div>
                {/* Removed rotating beam of light */}
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-6">
                Chart Your Career Course
              </h2>
              <p className="text-lg sm:text-xl text-slate-300 mb-4 leading-relaxed">
                Discover your professional constellation through AI-powered career mapping
              </p>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Upload your resume and watch as our AI creates a personalized career universe, connecting your skills to
                infinite possibilities across the professional galaxy.
              </p>
            </div>

            <Card className="border-2 border-dashed border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 backdrop-blur-sm">
              <CardContent className="p-8 sm:p-16 text-center">
                <div className="mb-8">
                  <div className="relative mb-6">
                    <Upload className="h-20 w-20 text-emerald-400 mx-auto animate-bounce" />
                    {/* Removed blurred glowing background */}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold mb-4 text-white">Launch Your Analysis</h3>
                  <p className="text-slate-300 mb-8 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
                    Upload your resume to begin mapping your career constellation
                  </p>
                </div>

                <div className="space-y-6">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload">
                    <Button
                      size="lg"
                      className="cursor-pointer text-base sm:text-lg px-8 sm:px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0"
                      asChild
                    >
                      <span>
                        <FileText className="h-5 w-5 mr-3" />
                        Select Resume File
                      </span>
                    </Button>
                  </label>

                  {uploadedFile && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 max-w-sm mx-auto border border-slate-700">
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/20 p-3 rounded-lg">
                          <FileText className="h-8 w-8 text-emerald-400" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{uploadedFile.name}</p>
                          <p className="text-sm text-slate-400">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 max-w-sm mx-auto">
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                  )}
                </div>

                {uploadedFile && (
                  <div className="mt-10">
                    <Button
                      onClick={handleAnalyze}
                      size="lg"
                      className="text-base sm:text-lg px-8 sm:px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0"
                    >
                      <Sparkles className="h-5 w-5 mr-3" />
                      Map My Career Universe
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 mt-16">
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700 hover:border-emerald-500/50 transition-all duration-300">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <Target className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h4 className="font-semibold mb-3 text-white text-lg">Precision Matching</h4>
                  <p className="text-slate-300 leading-relaxed">
                    AI analyzes your unique skill constellation to find perfect career alignments
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700 hover:border-blue-500/50 transition-all duration-300">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <MapPin className="h-8 w-8 text-blue-400" />
                  </div>
                  <h4 className="font-semibold mb-3 text-white text-lg">Guided Pathways</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Navigate your career journey with step-by-step roadmaps and milestones
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700 hover:border-purple-500/50 transition-all duration-300 sm:col-span-2 md:col-span-1">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <Lightbulb className="h-8 w-8 text-purple-400" />
                  </div>
                  <h4 className="font-semibold mb-3 text-white text-lg">Cosmic Insights</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Discover hidden connections between your skills and emerging opportunities
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === "analyzing" && (
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-16">
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full w-32 h-32 flex items-center justify-center mx-auto animate-pulse">
                  <Brain className="h-16 w-16 text-blue-400" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Mapping Your Universe</h2>
              <p className="text-slate-300 mb-12 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                Our AI is analyzing your professional DNA and connecting it to the vast career cosmos...
              </p>
            </div>

            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardContent className="p-8 sm:p-12">
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-medium text-white">Analysis Progress</span>
                    <span className="text-base sm:text-lg text-slate-300">{Math.round(analysisProgress)}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-4 bg-slate-700" />

                  <div className="space-y-6 text-left">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">Resume parsed and skills constellation mapped</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">Professional trajectory and domain identified</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <span className="text-slate-200">Connecting to career opportunities across the galaxy...</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "results" && (
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-full w-32 h-32 flex items-center justify-center mx-auto">
                  <Star className="h-16 w-16 text-yellow-400 animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent rounded-full animate-ping"></div>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-6">
                Your Career Constellation
              </h2>
              <p className="text-lg sm:text-xl text-slate-300 mb-4">
                Navigate through your personalized career universe
              </p>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Each glowing node represents a career path aligned with your skills. Click to explore the journey ahead.
              </p>
            </div>

            <div className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-3xl p-8 sm:p-16 mb-16 border border-slate-700 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]"></div>

              {/* Constellation connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {careerPaths.map((path, index) =>
                  careerPaths
                    .slice(index + 1)
                    .map((otherPath, otherIndex) => (
                      <line
                        key={`${index}-${otherIndex + index + 1}`}
                        x1={`${path.x}%`}
                        y1={`${path.y}%`}
                        x2={`${otherPath.x}%`}
                        y2={`${otherPath.y}%`}
                        stroke="rgba(59, 130, 246, 0.2)"
                        strokeWidth="1"
                        className={`transition-all duration-500 ${
                          hoveredPath === index || hoveredPath === otherIndex + index + 1
                            ? "stroke-emerald-400/60 stroke-2"
                            : ""
                        }`}
                      />
                    )),
                )}
              </svg>

              {/* Career path nodes */}
              <div className="relative h-64 sm:h-96">
                {careerPaths.map((path, index) => (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${path.x}%`, top: `${path.y}%` }}
                    onMouseEnter={() => setHoveredPath(index)}
                    onMouseLeave={() => setHoveredPath(null)}
                    onClick={() => setSelectedPath(selectedPath === index ? null : index)}
                  >
                    {/* Glow effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${path.color} rounded-full blur-lg opacity-30 scale-150 transition-all duration-500 ${
                        hoveredPath === index || selectedPath === index ? "opacity-50 scale-200" : ""
                      }`}
                    ></div>

                    {/* Main node */}
                    <div
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${path.color} rounded-full flex items-center justify-center text-xl sm:text-2xl border-2 border-white/20 transition-all duration-500 ${
                        hoveredPath === index || selectedPath === index
                          ? "scale-125 border-white/40"
                          : "hover:scale-110"
                      }`}
                    >
                      {path.icon}
                    </div>

                    {/* Match percentage badge */}
                    <div
                      className={`absolute -top-2 -right-2 bg-white/90 text-slate-900 text-xs font-bold px-2 py-1 rounded-full transition-all duration-300 ${
                        hoveredPath === index || selectedPath === index ? "scale-110" : ""
                      }`}
                    >
                      {path.match_percentage}%
                    </div>

                    {/* Hover tooltip */}
                    {hoveredPath === index && (
                      <div className="absolute top-20 sm:top-24 left-1/2 transform -translate-x-1/2 bg-slate-800/95 backdrop-blur-sm text-white p-4 rounded-xl border border-slate-600 min-w-48 sm:min-w-64 z-10 animate-in slide-in-from-bottom-2">
                        <h4 className="font-semibold mb-2 text-sm sm:text-base">{path.title}</h4>
                        <p className="text-xs sm:text-sm text-slate-300 mb-3">{path.salary_range}</p>
                        <div className="flex flex-wrap gap-1">
                          {path.skills.map((skill, skillIndex) => (
                            <Badge key={skillIndex} variant="secondary" className="text-xs bg-slate-700 text-slate-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected path details */}
            {selectedPath !== null && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <Card
                  className={`overflow-hidden border-2 bg-gradient-to-br ${careerPaths[selectedPath].color} text-white`}
                >
                  <CardHeader className="bg-black/20 border-b border-white/20 p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-2xl sm:text-3xl flex items-center gap-4 mb-3">
                          <span className="text-3xl sm:text-4xl flex-shrink-0">{careerPaths[selectedPath].icon}</span>
                          <span className="break-words">{careerPaths[selectedPath].title}</span>
                        </CardTitle>
                        <p className="text-white/90 text-base sm:text-lg leading-relaxed">
                          {careerPaths[selectedPath].fit_explanation}
                        </p>
                      </div>
                      <Button
                        onClick={() => setSelectedPath(null)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20 flex-shrink-0"
                      >
                        ✕
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-8">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold mb-2">
                          {careerPaths[selectedPath].match_percentage}%
                        </div>
                        <div className="text-white/80">Match Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-semibold mb-2 break-words">
                          {careerPaths[selectedPath].salary_range}
                        </div>
                        <div className="text-white/80">Salary Range</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-semibold mb-2">
                          {careerPaths[selectedPath].growth_potential}
                        </div>
                        <div className="text-white/80">Growth Potential</div>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setShowRoadmap(showRoadmap === selectedPath ? null : selectedPath)
                      }}
                      className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 py-4 text-base sm:text-lg"
                      variant="outline"
                    >
                      <MapPin className="h-5 w-5 mr-3" />
                      {showRoadmap === selectedPath ? "Hide Roadmap" : "View Career Roadmap"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Cross-Industry Opportunities */}
            {crossIndustry && (
              <div className="mt-12 animate-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                  <CardHeader className="border-b border-slate-700 p-6 sm:p-8">
                    <CardTitle className="text-xl sm:text-2xl text-white flex items-center gap-3">
                      <div className="bg-purple-500 rounded-full p-3">
                        <Network className="h-5 w-5 text-white" />
                      </div>
                      Cross-Industry Opportunities
                    </CardTitle>
                    <p className="text-slate-300 mt-2">
                      Your skills are transferable across multiple sectors, opening up a world of possibilities.
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    <p className="text-slate-300 leading-relaxed">{crossIndustry}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Roadmap display */}
            {showRoadmap !== null && (
              <div className="mt-12 animate-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                  <CardHeader className="border-b border-slate-700 p-6 sm:p-8">
                    <CardTitle className="text-xl sm:text-2xl text-white flex items-center gap-3">
                      <div className="bg-green-500 rounded-full p-3">
                        <ArrowRight className="h-5 w-5 text-white" />
                      </div>
                      <span className="break-words">
                        Your Journey to {careerPaths[showRoadmap]?.title || "Career Path"}
                      </span>
                    </CardTitle>
                    <p className="text-slate-300 mt-2">Navigate your path to success with these strategic milestones</p>
                  </CardHeader>

                  <CardContent className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                      {/* Immediate Steps */}
                      <div className="space-y-6">
                        <h4 className="font-semibold text-lg sm:text-xl mb-6 sm:mb-8 flex items-center gap-3 text-white">
                          <div className="bg-green-500 rounded-full p-3">
                            <ArrowRight className="h-5 w-5 text-white" />
                          </div>
                          Immediate Steps (0-6 months)
                        </h4>
                        <div className="space-y-6">
                          {careerPaths[showRoadmap]?.roadmap?.immediate_steps?.length > 0 ? (
                            careerPaths[showRoadmap].roadmap.immediate_steps.map((step, stepIndex) => (
                              <div
                                key={stepIndex}
                                className="flex gap-4 sm:gap-6 animate-in slide-in-from-left-4 duration-500"
                                style={{ animationDelay: `${stepIndex * 200}ms` }}
                              >
                                <div className="relative flex-shrink-0">
                                  <div className="bg-green-500/20 rounded-full p-3 border-2 border-green-500/30">
                                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                                  </div>
                                  {stepIndex < careerPaths[showRoadmap].roadmap.immediate_steps.length - 1 && (
                                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-12 bg-green-500/30" />
                                  )}
                                </div>
                                <div className="flex-1 bg-slate-700/30 p-4 sm:p-6 rounded-xl border border-slate-600 min-w-0">
                                  <p className="text-slate-200 leading-relaxed break-words">{step}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-400 text-center py-8">
                              <p>No immediate steps available for this career path.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Long-term Steps */}
                      <div className="space-y-6">
                        <h4 className="font-semibold text-lg sm:text-xl mb-6 sm:mb-8 flex items-center gap-3 text-white">
                          <div className="bg-blue-500 rounded-full p-3">
                            <TrendingUp className="h-5 w-5 text-white" />
                          </div>
                          Long-term Goals (6+ months)
                        </h4>
                        <div className="space-y-6">
                          {careerPaths[showRoadmap]?.roadmap?.long_term_steps?.length > 0 ? (
                            careerPaths[showRoadmap].roadmap.long_term_steps.map((step, stepIndex) => (
                              <div
                                key={stepIndex}
                                className="flex gap-4 sm:gap-6 animate-in slide-in-from-right-4 duration-500"
                                style={{ animationDelay: `${stepIndex * 200 + 600}ms` }}
                              >
                                <div className="relative flex-shrink-0">
                                  <div className="bg-blue-500/20 rounded-full p-3 border-2 border-blue-500/30">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                                  </div>
                                  {stepIndex < careerPaths[showRoadmap].roadmap.long_term_steps.length - 1 && (
                                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-12 bg-blue-500/30" />
                                  )}
                                </div>
                                <div className="flex-1 bg-slate-700/30 p-4 sm:p-6 rounded-xl border border-slate-600 min-w-0">
                                  <p className="text-slate-200 leading-relaxed break-words">{step}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-400 text-center py-8">
                              <p>No long-term goals available for this career path.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-12 bg-slate-700" />

                    <div className="flex justify-center">
                      <Link href="/candidate/jobs">
                        <Button
                          size="lg"
                          className="px-6 sm:px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-base sm:text-lg"
                        >
                          <ArrowRight className="h-5 w-5 mr-3" />
                          Find {careerPaths[showRoadmap]?.title || "Career Path"} Jobs
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
              <Button
                onClick={handleStartOver}
                variant="outline"
                size="lg"
                className="px-6 sm:px-8 py-4 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50 text-base sm:text-lg"
              >
                <Upload className="h-5 w-5 mr-3" />
                Analyze New Resume
              </Button>
              <Link href="/candidate/jobs">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-6 sm:px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-base sm:text-lg"
                >
                  <ArrowRight className="h-5 w-5 mr-3" />
                  Explore All Opportunities
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Removed rotating beam of light CSS */}
    </div>
  )
}

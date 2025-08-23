"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Briefcase, Users, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { account, ID } from "../appwrite"   // <-- adjust path if needed

export default function AuthPage() {
  const [userType, setUserType] = useState<"candidate" | "employer" | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  // shared form states
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- LOGIN FUNCTION ---
  const login = async () => {
    setLoading(true)
    setError(null)
    try {
      await account.createEmailPasswordSession(email, password)

      // fetch logged in user details
      const currentUser = await account.get()
      const prefs = currentUser.prefs || {}

      // redirect based on prefs.userType
      if (prefs.userType === "candidate") {
        window.location.href = "/candidate/dashboard"
      } else if (prefs.userType === "employer") {
        window.location.href = "/employer"
      } else {
        setError("User type not found. Please contact support.")
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred.")
      }
    } finally {
      setLoading(false)
    }
  }

  // --- REGISTER FUNCTION ---
  const register = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    setError(null)
    try {
      // 1. Create user account
      await account.create(ID.unique(), email, password, name || email)

      // 2. Immediately log them in
      await account.createEmailPasswordSession(email, password)

      // 3. Store extra fields in user preferences
      await account.updatePrefs({
        userType,
        company: userType === "employer" ? company : null,
      })

      // 4. Redirect accordingly
      window.location.href = userType === "candidate" ? "/candidate/dashboard" : "/employer"
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred.")
      }
    } finally {
      setLoading(false)
    }
  }

  // --- UI Switch ---
  if (!userType) {
    // Step 1: Select account type
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative">
        {/* Large Valecta logo at top left */}
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-3 z-10">
          <Briefcase className="h-12 w-13 text-primary" />
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Valecta</h1>
        </Link>
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2 mt-8">Welcome!</h2>
            <p className="text-muted-foreground">Choose your account type to get started</p>
          </div>
          <div className="flex flex-col md:flex-row gap-10 items-center justify-center">
            {/* Candidate Card */}
            <Card
              className="flex-1 max-w-xs cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 min-h-[320px] md:min-h-[380px]"
              onClick={() => setUserType('candidate')}
            >
              <CardContent className="p-10 md:p-14 text-center flex flex-col justify-center h-full">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">I&apos;m a Candidate</h3>
                <p className="text-lg text-muted-foreground">Looking for job opportunities</p>
              </CardContent>
            </Card>
            {/* Employer Card */}
            <Card
              className="flex-1 max-w-xs cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 min-h-[320px] md:min-h-[380px]"
              onClick={() => setUserType('employer')}
            >
              <CardContent className="p-10 md:p-14 text-center flex flex-col justify-center h-full">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">I&apos;m an Employer</h3>
                <p className="text-lg text-muted-foreground">Looking to hire talent</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Login/Sign up form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative">
      {/* Large Valecta logo at top left */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-3 z-10">
        <Briefcase className="h-12 w-13 text-primary" />
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Valecta</h1>
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button
            onClick={() => setUserType(null)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h2 className="text-3xl font-bold text-foreground mb-2 mt-8">
            {userType === "candidate" ? "Find Your Dream Job" : "Find Top Talent"}
          </h2>
          <p className="text-muted-foreground">
            {userType === "candidate"
              ? isSignUp
                ? "Create your account to get started"
                : "Sign in to access personalized job recommendations"
              : isSignUp
                ? "Create your employer account"
                : "Sign in to post jobs and manage candidates"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SIGN UP EXTRA FIELDS */}
            {isSignUp && (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                {userType === "employer" && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Enter company name"
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                )}
              </>
            )}

            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* CONFIRM PASSWORD */}
            {isSignUp && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {/* ERROR MESSAGE */}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* ACTION BUTTON */}
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={isSignUp ? register : login}
              disabled={loading}
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>

            {/* TOGGLE LOGIN <-> SIGNUP */}
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline">
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
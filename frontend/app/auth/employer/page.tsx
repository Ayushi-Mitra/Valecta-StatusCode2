"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Briefcase, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { account, ID } from "../../appwrite"

export default function EmployerAuthPage() {
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

      // Redirect directly to employer dashboard since this is the employer auth page
      window.location.href = "/employer"
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
        userType: "employer",
        company: company,
      })

      // 4. Redirect accordingly
      window.location.href = "/employer"
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative">
      {/* Large Valecta logo at top left */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-3 z-10">
        <img src="/logo.svg" alt="Valecta Logo" className="h-12 w-12" />
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Valecta</h1>
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Building className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2 mt-8">
            Find Top Talent
          </h2>
          <p className="text-muted-foreground">
            {isSignUp
              ? "Create your employer account"
              : "Sign in to post jobs and manage candidates"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? "Create Employer Account" : "Sign In as Employer"}</CardTitle>
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

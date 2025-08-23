"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import DecryptedText from "@/components/ui/decrypted-text"

export default function ValectaLanding() {
  const [showTitle, setShowTitle] = useState(false)
  const [showTypewriter, setShowTypewriter] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)
  const [showButtons, setShowButtons] = useState(false)
  const [currentLine, setCurrentLine] = useState(0)
  const [matrixRain, setMatrixRain] = useState<any[]>([])
  const router = useRouter()

  const typewriterLines = ["Where potential meets precision","AI-powered interviews", "Redefining recruitment"]

  const matrixChars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"

  useEffect(() => {
    const titleTimer = setTimeout(() => setShowTitle(true), 2000)
    const typewriterTimer = setTimeout(() => setShowTypewriter(true), 4000)
    const questionTimer = setTimeout(() => setShowQuestion(true), 9000)
    const buttonsTimer = setTimeout(() => setShowButtons(true), 11000)

    // Generate matrix rain data on mount (client only)
    const numColumns = 80
    const numRows = 20
    const rain = Array.from({ length: numColumns }).map(() => {
      return {
        left: Math.random() * 100,
        animationDelay: Math.random() * 4,
        animationDuration: 4 + Math.random() * 3,
        chars: Array.from({ length: numRows }).map(() => Math.floor(Math.random() * matrixChars.length)),
      }
    })
    setMatrixRain(rain)

    return () => {
      clearTimeout(titleTimer)
      clearTimeout(typewriterTimer)
      clearTimeout(questionTimer)
      clearTimeout(buttonsTimer)
    }
  }, [])

  useEffect(() => {
    if (showTypewriter && currentLine < typewriterLines.length - 1) {
      const lineTimer = setTimeout(() => {
        setCurrentLine((prev) => prev + 1)
      }, 1500)
      return () => clearTimeout(lineTimer)
    }
  }, [showTypewriter, currentLine, typewriterLines.length])

  const handleRoleSelection = (role: "candidate" | "employer") => {
    router.push(`/auth/${role}`)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-15">
        {matrixRain.map((col, i) => (
          <div
            key={i}
            className="absolute text-primary font-mono text-xs matrix-rain"
            style={{
              left: `${col.left}%`,
              animationDelay: `${col.animationDelay}s`,
              animationDuration: `${col.animationDuration}s`,
            }}
          >
            {col.chars.map((charIdx: number, j: number) => (
              <div key={j} className="block">
                {matrixChars[charIdx]}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {showTitle && (
          <div className="text-center mb-12">
            <DecryptedText
              text="This is Valecta"
              className="text-6xl md:text-8xl font-mono font-bold text-primary"
              encryptedClassName="text-6xl md:text-8xl font-mono font-bold text-primary/50"
              animateOn="view"
              sequential={true}
              speed={87}
              maxIterations={13}
              characters={matrixChars}
            />
          </div>
        )}

        {/* Typewriter Lines */}
        {showTypewriter && (
          <div className="text-center mb-16 space-y-4">
            {typewriterLines.slice(0, currentLine + 1).map((line, index) => (
              <div
                key={index}
                className={`text-xl md:text-2xl font-mono text-foreground ${index === currentLine ? "typewriter" : ""}`}
                style={{
                  animationDelay: index === currentLine ? "0s" : "none",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        )}

        {showQuestion && (
          <div className="text-center mb-8">
            <p className="text-xl md:text-2xl font-mono text-muted-foreground typewriter">
              Are you a Candidate or an Employer?
            </p>
          </div>
        )}

        {showButtons && (
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in">
            <Button
              onClick={() => handleRoleSelection("candidate")}
              className="px-12 py-6 text-lg font-mono bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
              variant="outline"
            >
              Candidate
            </Button>

            <Button
              onClick={() => handleRoleSelection("employer")}
              className="px-12 py-6 text-lg font-mono bg-transparent border-2 border-secondary text-secondary hover:bg-secondary hover:text-white transition-all duration-300"
              variant="outline"
            >
              Employer
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

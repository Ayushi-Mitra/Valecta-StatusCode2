
import React from "react"
import type { Metadata } from "next"
import { Fira_Code } from "next/font/google"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./globals.css"


const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fira-code",
})

export const metadata: Metadata = {
  title: "Valecta - AI-Powered Interviews",
  description: "Redefining recruitment with AI-powered interviews. Smarter hiring. Better preparation.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Use a client component to access the pathname
  return (
    <html lang="en" className={`dark ${firaCode.variable}`}>
      <body className="antialiased font-mono">
  {/** Client-only background logic in a separate component */}
  {React.createElement(require("@/components/ui/LayoutWithBackground").default, {}, children)}
      </body>
    </html>
  )
}

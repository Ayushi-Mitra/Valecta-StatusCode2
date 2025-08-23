export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000",
    endpoints: {
      health: "/health",
      session: {
        start: "/session/start",
        answers: (sessionId: string) => `/session/${sessionId}/answers`,
        questions: (sessionId: string) => `/session/${sessionId}/questions`,
        latestQuestion: (sessionId: string) => `/session/${sessionId}/questions/latest`,
        history: (sessionId: string) => `/session/${sessionId}/history`,
        end: (sessionId: string) => `/session/${sessionId}/end`,
        nextQuestion: (sessionId: string) => `/session/${sessionId}/next-question`,
      },
      prompt: {
        initial: "/prompt/initial",
      },
    },
  },
  app: {
    name: "Valecta",
    description: "AI-Powered Job Matching Platform",
  },
}

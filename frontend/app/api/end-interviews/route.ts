// import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   try {
//     // ✅ Call Flask /end-interview (GET)
//     const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/end-interview`, {
//       method: "GET",
//     });

//     if (!aiResponse.ok) {
//       throw new Error(`Flask server error: ${aiResponse.statusText}`);
//     }

//     // ✅ Get binary audio from Flask
//     const arrayBuffer = await aiResponse.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     // ✅ Forward response back to frontend
//     return new NextResponse(buffer, {
//       status: 200,
//       headers: {
//         "Content-Type": "audio/mpeg", // MP3 MIME type
//         "Content-Disposition": 'inline; filename="outro.mp3"', // allow inline playback
//       },
//     });
//   } catch (error) {
//     console.error("EndInterview API Error:", error);
//     return NextResponse.json(
//       {
//         error: "Internal server error",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { databases } from "../../appwrite";
import * as fs from "fs";
import * as path from "path";
import FormData from "form-data";
import fetch from "node-fetch";
import OpenAI from "openai";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const JOBS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_JOBS_COLLECTION_ID!;
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ keep track of context between questions
let lastQuestion: string = "";
let lastModelAnswer: string = "";

async function transcribeAudio(filePath: string): Promise<string> {
  try {
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "gpt-4o-transcribe",
    });
    return transcription.text;
  } catch (err) {
    console.error("Transcription error:", err);
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobId = formData.get("jobId") as string;
    const questionNum = formData.get("questionNum") as string;

    if (!jobId || !questionNum) {
      return NextResponse.json(
        { error: "Both jobId and questionNum are required" },
        { status: 400 }
      );
    }

    // ✅ Fetch job description
    const jobDocument = await databases.getDocument(
      DATABASE_ID,
      JOBS_COLLECTION_ID,
      jobId
    );

    const jobDescription = `
Title: ${jobDocument.title || jobDocument.role}
Company: ${jobDocument.company || jobDocument.companyName}
Location: ${jobDocument.location}
Type: ${jobDocument.type || jobDocument.jobType}
Salary: ${jobDocument.salary}
Description: ${jobDocument.description}
Requirements: ${
      Array.isArray(jobDocument.requirements)
        ? jobDocument.requirements.join(", ")
        : jobDocument.requirements || ""
    }
Skills: ${
      Array.isArray(jobDocument.skills)
        ? jobDocument.skills.join(", ")
        : jobDocument.skills || ""
    }
Experience Level: ${jobDocument.experienceLevel || ""}
    `.trim();

    // ✅ Derive file path automatically
        const fileName = `question_${questionNum}_response.webm`;
        const fullPath = path.join(process.cwd(), "public", "recordings", fileName);
    
        if (!fs.existsSync(fullPath)) {
          return NextResponse.json(
            { error: `Recording file not found: ${fileName}` },
            { status: 404 }
          );
        }
    
        // ✅ Step 1: Transcribe audio
        const humanAnswerText = await transcribeAudio(fullPath);

    // ✅ Prepare form for Flask
    const flaskForm = new FormData();
    flaskForm.append("job_description", jobDescription);
    flaskForm.append("question", lastQuestion);
    flaskForm.append("model_answer", lastModelAnswer);

    // instead of audio file, we pass transcription from frontend earlier
    // if needed, hook transcription here like in your /interview route
    //const transcript = "user's last answer text"; // TODO: inject real transcription
    flaskForm.append("human_answer", humanAnswerText);

    // ✅ Call Flask /end-interview
  const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/end-interview`, {
      method: "POST",
      body: flaskForm as any,
      headers: flaskForm.getHeaders(),
    });

    if (!aiResponse.ok) {
      throw new Error(`Flask server error: ${aiResponse.statusText}`);
    }

    // ✅ Parse multipart/mixed
    const contentType = aiResponse.headers.get("content-type") || "";
    if (contentType.includes("multipart/mixed")) {
      const respBuffer = Buffer.from(await aiResponse.arrayBuffer());
      const boundary = contentType.split("boundary=")[1];
      let outro = "";
      let score: number | null = null;
      let audioBase64: string | null = null;

      if (boundary) {
        const parts = respBuffer.toString("binary").split(`--${boundary}`);
        for (const part of parts) {
          if (part.includes("application/json")) {
            const jsonMatch = part.split("\r\n\r\n")[1];
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch.trim());
              outro = parsed.outro || "";
              score = parsed.score ? parseFloat(parsed.score) : null;
            }
          } else if (part.includes("audio/mpeg")) {
            const idx = part.indexOf("\r\n\r\n");
            if (idx !== -1) {
              const audioData = part.substring(idx + 4).trim();
              if (audioData) {
                const audioBuffer = Buffer.from(audioData, "binary");
                audioBase64 = audioBuffer.toString("base64");
              }
            }
          }
        }
      }

      return NextResponse.json({
        outro,
        score,
        audio: audioBase64,
      });
    }

    throw new Error("Unsupported response type from Flask");
  } catch (error) {
    console.error("EndInterview API Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

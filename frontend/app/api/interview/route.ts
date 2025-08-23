// import { NextRequest, NextResponse } from "next/server";
// import { databases } from "../../appwrite";
// import * as fs from "fs";
// import * as path from "path";
// import FormData from "form-data";
// import fetch from "node-fetch";
// import OpenAI from "openai";

// const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
// const JOBS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_JOBS_COLLECTION_ID!;
// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // in-memory storage
// let lastQuestion: string = "";
// let lastModelAnswer: string = "";

// async function transcribeAudio(filePath: string): Promise<string> {
//   try {
//     const transcription = await client.audio.transcriptions.create({
//       file: fs.createReadStream(filePath),
//       model: "gpt-4o-transcribe",
//     });
//     return transcription.text;
//   } catch (err) {
//     console.error("Transcription error:", err);
//     return "";
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const formData = await req.formData();
//     const jobId = formData.get("jobId") as string;
//     const questionNum = formData.get("questionNum") as string; // new input

//     if (!jobId || !questionNum) {
//       return NextResponse.json(
//         { error: "Both jobId and questionNum are required" },
//         { status: 400 }
//       );
//     }

//     // ✅ Fetch Job Description
//     const jobDocument = await databases.getDocument(
//       DATABASE_ID,
//       JOBS_COLLECTION_ID,
//       jobId
//     );

//     const jobDescription = `
// Title: ${jobDocument.title || jobDocument.role}
// Company: ${jobDocument.company || jobDocument.companyName}
// Location: ${jobDocument.location}
// Type: ${jobDocument.type || jobDocument.jobType}
// Salary: ${jobDocument.salary}
// Description: ${jobDocument.description}
// Requirements: ${
//       Array.isArray(jobDocument.requirements)
//         ? jobDocument.requirements.join(", ")
//         : jobDocument.requirements || ""
//     }
// Skills: ${
//       Array.isArray(jobDocument.skills)
//         ? jobDocument.skills.join(", ")
//         : jobDocument.skills || ""
//     }
// Experience Level: ${jobDocument.experienceLevel || ""}
//     `.trim();

//     // ✅ Derive file path automatically
//     const fileName = `question_${questionNum}_response.webm`;
//     const fullPath = path.join(process.cwd(), "public", "recordings", fileName);

//     if (!fs.existsSync(fullPath)) {
//       return NextResponse.json(
//         { error: `Recording file not found: ${fileName}` },
//         { status: 404 }
//       );
//     }

//     // ✅ Step 1: Transcribe audio
//     const humanAnswerText = await transcribeAudio(fullPath);

//     // ✅ Step 2: Prepare FormData
//     const flaskForm = new FormData();
//     flaskForm.append("job_description", jobDescription);
//     flaskForm.append("human_answer_text", humanAnswerText);
//     flaskForm.append("question", lastQuestion);
//     flaskForm.append("model_answer", lastModelAnswer);

//     // ✅ Step 3: Send to Flask
//     const aiResponse = await fetch("http://127.0.0.1:5000/interview", {
//       method: "POST",
//       body: flaskForm as any,
//       headers: flaskForm.getHeaders(),
//     });

//     if (!aiResponse.ok) {
//       throw new Error(`AI server error: ${aiResponse.statusText}`);
//     }

//     // ✅ Step 4: Handle response
//     const contentType = aiResponse.headers.get("content-type") || "";

//     if (contentType.includes("application/json")) {
//       const result = (await aiResponse.json()) as {
//         question?: string;
//         model_answer?: string;
//         [key: string]: any;
//       };

//       // update memory
//       if (result.question) lastQuestion = result.question;
//       if (result.model_answer) lastModelAnswer = result.model_answer;

//       return NextResponse.json(result);
//     } else {
//       // multipart fallback
//       const respBuffer = Buffer.from(await aiResponse.arrayBuffer());
//       const boundary = contentType.split("boundary=")[1];

//       if (boundary) {
//         const parts = respBuffer.toString("binary").split(`--${boundary}`);
//         for (const part of parts) {
//           if (part.includes("application/json")) {
//             const jsonMatch = part.split("\r\n\r\n")[1];
//             if (jsonMatch) {
//               try {
//                 const parsed = JSON.parse(jsonMatch.trim());
//                 lastQuestion = parsed.question || "";
//                 lastModelAnswer = parsed.model_answer || "";
//               } catch (err) {
//                 console.error("Error parsing JSON from AI response:", err);
//               }
//             }
//           }
//         }
//       }

//       return new NextResponse(respBuffer, {
//         status: 200,
//         headers: { "Content-Type": contentType },
//       });
//     }
//   } catch (error) {
//     console.error("Interview API Error:", error);
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

// in-memory storage
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

    // ✅ Fetch Job Description
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

    // ✅ Step 2: Prepare FormData
    const flaskForm = new FormData();
    flaskForm.append("job_description", jobDescription);
    flaskForm.append("human_answer_text", humanAnswerText);
    flaskForm.append("question", lastQuestion);
    flaskForm.append("model_answer", lastModelAnswer);

    // ✅ Step 3: Send to Flask
    const aiResponse = await fetch("http://127.0.0.1:5000/interview", {
      method: "POST",
      body: flaskForm as any,
      headers: flaskForm.getHeaders(),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI server error: ${aiResponse.statusText}`);
    }

    // ✅ Step 4: Handle multipart response
    const contentType = aiResponse.headers.get("content-type") || "";

    if (contentType.includes("multipart/mixed")) {
      const respBuffer = Buffer.from(await aiResponse.arrayBuffer());
      const boundary = contentType.split("boundary=")[1];
      let parsedJson: any = {};
      let audioBase64: string | null = null;

      if (boundary) {
        const parts = respBuffer.toString("binary").split(`--${boundary}`);
        for (const part of parts) {
          if (part.includes("application/json")) {
            const jsonMatch = part.split("\r\n\r\n")[1];
            if (jsonMatch) {
              parsedJson = JSON.parse(jsonMatch.trim());
              lastQuestion = parsedJson.question || "";
              lastModelAnswer = parsedJson.model_answer || "";
            }
          } else if (part.includes("audio/mpeg")) {
            const idx = part.indexOf("\r\n\r\n");
            if (idx !== -1) {
              const audioData = part.substring(idx + 4).trim();
              if (audioData) {
                // Convert binary string → base64
                const audioBuffer = Buffer.from(audioData, "binary");
                audioBase64 = audioBuffer.toString("base64");
              }
            }
          }
        }
      }

      return NextResponse.json({
        ...parsedJson,
        audio: audioBase64, // base64 encoded audio
      });
    }

    // ✅ If plain JSON (no audio)
    if (contentType.includes("application/json")) {
      const result = (await aiResponse.json()) as {
        question?: string;
        model_answer?: string;
        [key: string]: any;
      };

      if (result.question) lastQuestion = result.question;
      if (result.model_answer) lastModelAnswer = result.model_answer;

      return NextResponse.json(result);
    }

    throw new Error("Unsupported response type from Flask");
  } catch (error) {
    console.error("Interview API Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { databases } from "../../appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const JOBS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_JOBS_COLLECTION_ID!;

interface RequestBody {
  jobId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    // ✅ Fetch Job description from Appwrite
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

    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description could not be constructed" },
        { status: 400 }
      );
    }

    // ✅ Call Flask AI server
  const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/start-interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_description: jobDescription }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI server error: ${aiResponse.statusText}`);
    }

    // ✅ Extract audio as binary
    const arrayBuffer = await aiResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // // Convert to base64
    // const audioBase64 = buffer.toString("base64");

    // // ✅ Build JSON response
    // return NextResponse.json({
    //   audio: audioBase64,
    // });
     return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg", // mp3 MIME type
        "Content-Disposition": 'inline; filename="ai_voice.mp3"', // browser can play directly
      },
    });
  } catch (error) {
    console.error("StartInterview API Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

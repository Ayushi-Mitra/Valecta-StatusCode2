import { NextRequest, NextResponse } from "next/server";
import { databases, storage } from "../../appwrite";

// Configuration constants
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const JOBS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_JOBS_COLLECTION_ID!;
const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;

interface RequestBody {
  jobId: string;
  resumeField?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { jobId, resumeField } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Fetch job description
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
Requirements: ${Array.isArray(jobDocument.requirements) 
  ? jobDocument.requirements.join(", ") 
  : jobDocument.requirements || ""
}
Skills: ${Array.isArray(jobDocument.skills) 
  ? jobDocument.skills.join(", ") 
  : jobDocument.skills || ""
}
Experience Level: ${jobDocument.experienceLevel || ""}
    `.trim();

    let resumeBase64 = "";
    let fileId = resumeField;

    // Fetch and encode resume if fileId is available
    if (fileId) {
      try {
        let buffer: Buffer;
        
        // If fileId is a URL, fetch the PDF directly from the URL
        if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
          // Fetch PDF content from URL
          const response = await fetch(fileId);
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF from URL: ${response.statusText}`);
          }
          const fileBuffer = await response.arrayBuffer();
          buffer = Buffer.from(fileBuffer);
        } else {
          // If it's a file ID, get from Appwrite storage
          const fileBuffer = await storage.getFileDownload(STORAGE_BUCKET_ID, fileId);
          buffer = Buffer.from(fileBuffer);
        }
        
        // Convert to base64
        resumeBase64 = buffer.toString('base64');
      } catch (error) {
        console.error("Error fetching resume file:", error);
        return NextResponse.json(
          { error: "Failed to fetch resume file", details: error instanceof Error ? error.message : "Unknown error" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Resume file ID not found" },
        { status: 404 }
      );
    }

    // Return the required format
  const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resume-review`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    filedata: resumeBase64,
    job_description: jobDescription,
  }),
});

if (!aiResponse.ok) {
  throw new Error(`AI server error: ${aiResponse.statusText}`);
}

const aiResult = await aiResponse.json();

// ✅ Final return — this goes back to your frontend
return NextResponse.json(aiResult);

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

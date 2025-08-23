import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // ✅ Call Flask /end-interview (GET)
    const aiResponse = await fetch("http://127.0.0.1:5000/end-interview", {
      method: "GET",
    });

    if (!aiResponse.ok) {
      throw new Error(`Flask server error: ${aiResponse.statusText}`);
    }

    // ✅ Get binary audio from Flask
    const arrayBuffer = await aiResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ✅ Forward response back to frontend
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg", // MP3 MIME type
        "Content-Disposition": 'inline; filename="outro.mp3"', // allow inline playback
      },
    });
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

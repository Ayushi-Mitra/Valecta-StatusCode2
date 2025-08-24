import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";

export async function POST(request: NextRequest) {
  try {
    // ✅ Parse the form-data (expecting "file" field from frontend)
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // ✅ Convert PDF → Buffer → Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString("base64");

    // ✅ Send base64 to Flask server
  const flaskResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/path-predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filedata: base64String }),
    });

    if (!flaskResponse.ok) {
      throw new Error(`Flask server error: ${flaskResponse.statusText}`);
    }

    const flaskData = await flaskResponse.json();

    // return NextResponse.json(flaskData, { status: 200 });
    let parsedValue = null;
    try {
      parsedValue = flaskData.value ? JSON.parse(flaskData.value) : null;
    } catch (e) {
      console.warn("Could not parse Flask value as JSON:", e);
    }

    // ✅ Build final response by merging
    const finalResponse = {
      message: flaskData.message || null,
      value: parsedValue || flaskData.value, // fallback if parsing fails
    };

    return NextResponse.json(finalResponse, { status: 200 });
  } catch (error) {
    console.error("PathPredict API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

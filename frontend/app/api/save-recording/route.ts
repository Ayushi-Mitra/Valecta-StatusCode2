import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    const questionNumber = formData.get('questionNumber') as string;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use the original file name and extension if available
    let originalName = (audioFile as any).name || '';
    let ext = '';
    if (originalName && originalName.includes('.')) {
      ext = originalName.substring(originalName.lastIndexOf('.'));
    } else if (audioFile.type) {
      // fallback: try to infer extension from MIME type
      const mimeToExt: Record<string, string> = {
        'audio/webm': '.webm',
        'audio/ogg': '.ogg',
        'audio/mp3': '.mp3',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'audio/mp4': '.mp4',
      };
      ext = mimeToExt[audioFile.type] || '';
    }

    // Create filename based on question number and original extension
    const fileName = `question_${questionNumber}_response${ext}`;

    // Define the path to save the file in public/recordings
    const recordingsDir = path.join(process.cwd(), 'public', 'recordings');

    // Create recordings directory if it doesn't exist
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    const filePath = path.join(recordingsDir, fileName);

    // Write the file to disk
    fs.writeFileSync(filePath, buffer);

    console.log(`Audio file saved at: ${filePath}`);

    return NextResponse.json({ 
      success: true, 
      filePath: `/recordings/${fileName}`,
      message: `File saved as ${fileName}` 
    });
  } catch (error) {
    console.error('Error saving audio file:', error);
    return NextResponse.json({ 
      error: 'Failed to save audio file', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

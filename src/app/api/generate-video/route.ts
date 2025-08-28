import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured. Add GOOGLE_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    console.log('Starting video generation with prompt:', prompt);

    // Import and use the Google GenAI library
    const { GoogleGenAI } = await import('@google/genai');
    const genAI = new GoogleGenAI({ apiKey });

    // Generate video using Veo
    let operation = await genAI.models.generateVideos({
      model: "veo-2.0-generate-001",
      prompt: prompt,
      config: {
        aspectRatio: "16:9",
      },
    });

    console.log('Video generation operation started');

    // Poll until completion (this might take 2-3 minutes)
    while (!operation.done) {
      console.log('Waiting for video generation to complete...');
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      operation = await genAI.operations.getVideosOperation({
        operation: operation,
      });
    }

    // Get the generated video
    const generatedVideos = operation.response?.generatedVideos || [];
    if (generatedVideos.length > 0) {
      const videoUri = generatedVideos[0].video?.uri;
      if (videoUri) {
        // Create a proxy URL instead of direct Google URL
        const baseUrl = request.nextUrl.origin;
        const proxyUrl = `${baseUrl}/api/download-video?url=${encodeURIComponent(videoUri)}`;
        
        return NextResponse.json({
          message: 'Video generation completed!',
          prompt: prompt,
          status: 'completed',
          videoUrl: proxyUrl
        });
      }
    }
    
    return NextResponse.json(
      { error: 'Video generation completed but no video was produced' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate video', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

interface Model {
  name?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, image, generationType = 'text-to-video' } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (generationType === 'image-to-video' && !image) {
      return NextResponse.json(
        { error: 'Image is required for image-to-video generation' },
        { status: 400 }
      );
    }

    console.log(`Starting ${generationType} generation with prompt:`, prompt);

    // Check if we have an API key in environment variables
    const apiKey = process.env.GOOGLE_API_KEY || process.env.VEO_3_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'API key required. Please add your Google API key to .env.local as GOOGLE_API_KEY',
        },
        { status: 500 }
      );
    }

    console.log('Using API key for Veo authentication');

    // Import and use the Google GenAI library with API key
    const { GoogleGenAI } = await import('@google/genai');
    const genAI = new GoogleGenAI({ apiKey });

    // Use the correct model names we found
    const modelsToTry = [
      'veo-3.0-generate-preview', // Veo 3.0 with audio
      'veo-2.0-generate-001',     // Veo 2.0 fallback
    ];

    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        
        // Different parameter structures for different generation types
        let generationParams: any;

        if (generationType === 'image-to-video' && image) {
          // For image-to-video, try different image parameter structures
          const imageStructures = [
            // Structure 1: Direct in image property
            {
              model: modelName,
              prompt: prompt,
              image: {
                bytesBase64Encoded: image,
                mimeType: "image/jpeg",
              },
              config: {
                aspectRatio: "16:9",
              },
            },
            // Structure 2: Nested in image.image
            {
              model: modelName,
              prompt: prompt,
              image: {
                image: {
                  bytesBase64Encoded: image,
                  mimeType: "image/jpeg",
                }
              },
              config: {
                aspectRatio: "16:9",
              },
            },
            // Structure 3: As contents array
            {
              model: modelName,
              prompt: prompt,
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: "image/jpeg",
                        data: image
                      }
                    },
                    {
                      text: prompt
                    }
                  ]
                }
              ],
              config: {
                aspectRatio: "16:9",
              },
            }
          ];

          // Try each image structure
          for (let i = 0; i < imageStructures.length; i++) {
            try {
              console.log(`Trying image structure ${i + 1} for ${modelName}`);
              generationParams = imageStructures[i];
              
              let operation = await genAI.models.generateVideos(generationParams);
              console.log(`✅ Successfully using model: ${modelName} with image structure ${i + 1}`);
              
              // If we get here, this structure works - continue with polling
              break;
            } catch (structureError) {
              console.log(`❌ Image structure ${i + 1} failed:`, structureError);
              if (i === imageStructures.length - 1) {
                throw structureError; // All structures failed
              }
              continue;
            }
          }
        } else {
          // For text-to-video, use simple structure
          generationParams = {
            model: modelName,
            prompt: prompt,
            config: {
              aspectRatio: "16:9",
            },
          };
        }

        // Generate video
        let operation = await genAI.models.generateVideos(generationParams);
        console.log(`✅ Successfully started generation with model: ${modelName}`);

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
            
            const isVeo3 = modelName.includes('3.0');
            
            return NextResponse.json({
              message: `Video generation completed with ${modelName}${isVeo3 ? ' (with audio support!)' : ''}`,
              prompt: prompt,
              status: 'completed',
              videoUrl: proxyUrl,
              generationType: generationType,
              inputImage: generationType === 'image-to-video' ? image : undefined,
              hasAudio: isVeo3, // Only Veo 3.0+ has audio
              modelUsed: modelName
            });
          }
        }
        
        return NextResponse.json(
          { error: 'Video generation completed but no video was produced' },
          { status: 500 }
        );

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Model ${modelName} failed:`, errorMessage);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue; // Try next model
      }
    }

    // If we get here, all models failed
    return NextResponse.json(
      { 
        error: 'No working video generation models found', 
        details: `Tried models: ${modelsToTry.join(', ')}`,
        lastError: lastError?.message || 'Unknown error'
      },
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

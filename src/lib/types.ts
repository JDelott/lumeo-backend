export interface VideoGenerationRequest {
  prompt: string;
  image?: string; // Base64 encoded image for image-to-video
  generationType?: 'text-to-video' | 'image-to-video';
}

export interface VideoGenerationResponse {
  message: string;
  prompt: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string | null;
  estimatedTime?: string;
  generationType?: 'text-to-video' | 'image-to-video';
  inputImage?: string; // For displaying the source image in results
  hasAudio?: boolean; // New field to indicate if video has audio
}

export interface VideoGenerationError {
  error: string;
  message?: string;
}

export interface VeoConfig {
  aspectRatio: '16:9' | '9:16' | '1:1';
  duration?: number;
  quality?: 'standard' | 'high';
}

// API generation parameters interface for Veo 3.0
export interface VideoGenerationParams {
  model: string;
  prompt: string;
  config: {
    aspectRatio: string;
  };
  image?: {
    bytesBase64Encoded: string;
    mimeType: string;
  };
}

export type ApiResponse<T> = T | VideoGenerationError;

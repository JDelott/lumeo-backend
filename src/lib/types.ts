export interface VideoGenerationRequest {
  prompt: string;
}

export interface VideoGenerationResponse {
  message: string;
  prompt: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string | null;
  estimatedTime?: string;
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

export type ApiResponse<T> = T | VideoGenerationError;

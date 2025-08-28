'use client';

import { useState, useRef } from 'react';
import { Send, Sparkles, Video, Loader2, Zap, Download, CheckCircle, Upload, Image, Type } from 'lucide-react';
import NextImage from 'next/image';
import { VideoGenerationResponse, VideoGenerationRequest } from '@/lib/types';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<VideoGenerationResponse | null>(null);
  const [error, setError] = useState('');
  const [generationType, setGenerationType] = useState<'text-to-video' | 'image-to-video'>('text-to-video');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        // Convert to base64 without data URL prefix for API
        const base64 = result.split(',')[1];
        setSelectedImage(base64);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (generationType === 'image-to-video' && !selectedImage) {
      setError('Please upload an image for image-to-video generation');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const requestBody: VideoGenerationRequest = {
        prompt,
        generationType,
      };

      if (generationType === 'image-to-video' && selectedImage) {
        requestBody.image = selectedImage;
      }

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data: VideoGenerationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate video');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVideo = async (videoUrl: string) => {
    try {
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `lumeo-video-${Date.now()}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download video. Please try right-clicking the video and saving it.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-neon-yellow rounded-full animate-glow-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-cosmic-pink rounded-full animate-float"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-summer-cyan rounded-full animate-glow-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-5 h-5 bg-electric-blue rounded-full animate-float"></div>
      </div>

      <div className="w-full max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Video className="w-12 h-12 text-electric-blue animate-glow-pulse" />
            <h1 className="text-6xl font-bold text-glow bg-gradient-to-r from-electric-blue via-cosmic-pink to-summer-cyan bg-clip-text text-transparent">
              Lumeo
            </h1>
            <Sparkles className="w-12 h-12 text-cosmic-pink animate-float" />
          </div>
          
          <p className="text-xl text-stellar-white/80 max-w-2xl mx-auto leading-relaxed">
            Transform your imagination into stunning AI-generated videos.{' '}
            <span className="text-electric-blue font-semibold">Powered by Gemini Veo</span>
            {' '}— where creativity meets cutting-edge technology.
          </p>
        </div>

        {/* Generation Type Selection */}
        <div className="glass-effect rounded-3xl p-6 mb-8 border-glow border-electric-blue/30">
          <h3 className="text-lg font-semibold text-stellar-white mb-4 text-center">Choose Generation Type</h3>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setGenerationType('text-to-video');
                clearImage();
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                generationType === 'text-to-video'
                  ? 'bg-gradient-to-r from-electric-blue to-cosmic-pink text-stellar-white border-2 border-electric-blue/50'
                  : 'bg-nebula-gray/30 text-stellar-white/70 hover:bg-nebula-gray/50'
              }`}
            >
              <Type className="w-5 h-5" />
              Text to Video
            </button>
            <button
              onClick={() => setGenerationType('image-to-video')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                generationType === 'image-to-video'
                  ? 'bg-gradient-to-r from-electric-blue to-cosmic-pink text-stellar-white border-2 border-electric-blue/50'
                  : 'bg-nebula-gray/30 text-stellar-white/70 hover:bg-nebula-gray/50'
              }`}
            >
              <Image className="w-5 h-5" aria-label="Image icon" />
              Image to Video
            </button>
          </div>
        </div>

        {/* Main Form */}
        <div className="glass-effect rounded-3xl p-8 mb-8 border-glow border-electric-blue/30">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Image Upload Section for Image-to-Video */}
            {generationType === 'image-to-video' && (
              <div>
                <label className="block text-lg font-medium text-stellar-white mb-3">
                  Upload Source Image
                </label>
                <div className="space-y-4">
                  {!imagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-electric-blue/50 rounded-xl p-8 text-center cursor-pointer hover:border-electric-blue transition-all duration-300 hover:bg-electric-blue/5"
                    >
                      <Upload className="w-12 h-12 text-electric-blue mx-auto mb-4" />
                      <p className="text-stellar-white/80 mb-2">Click to upload an image</p>
                      <p className="text-stellar-white/50 text-sm">Supports JPG, PNG, WebP (max 10MB)</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <NextImage
                        src={imagePreview}
                        alt="Uploaded preview"
                        width={500}
                        height={300}
                        className="w-full max-h-64 object-contain rounded-xl border-2 border-electric-blue/50"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-cosmic-pink text-stellar-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-cosmic-pink/80 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Prompt Section */}
            <div>
              <label htmlFor="prompt" className="block text-lg font-medium text-stellar-white mb-3">
                {generationType === 'image-to-video' 
                  ? 'Describe the motion you want to add'
                  : 'Describe your video vision'
                }
              </label>
              <div className="relative">
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    generationType === 'image-to-video'
                      ? "Camera pans to the right, gentle breeze moves the leaves, add floating particles..."
                      : "A serene mountain lake at sunset with floating geometric shapes, or a futuristic cityscape with glowing neon lights dancing in the sky..."
                  }
                  className="w-full h-32 px-4 py-3 bg-nebula-gray/50 border-2 border-electric-blue/30 rounded-xl text-stellar-white placeholder-stellar-white/50 focus:border-electric-blue focus:outline-none transition-all duration-300 resize-none"
                  disabled={isGenerating}
                />
                <div className="absolute bottom-3 right-3">
                  <Zap className="w-5 h-5 text-neon-yellow animate-glow-pulse" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim() || (generationType === 'image-to-video' && !selectedImage)}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-electric-blue via-space-purple to-cosmic-pink text-stellar-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border-glow border-electric-blue/50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Creating Your Video... (2-3 minutes)
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  Generate Video
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="glass-effect rounded-xl p-4 mb-8 border-2 border-cosmic-pink/50 bg-cosmic-pink/10">
            <p className="text-cosmic-pink text-center font-medium">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="glass-effect rounded-3xl p-8 border-glow border-summer-cyan/30">
            <h3 className="text-2xl font-bold text-summer-cyan mb-4 text-center flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Your Video is Ready!
            </h3>
            <div className="space-y-4 text-stellar-white">
              <p><strong>Generation Type:</strong> <span className="text-summer-cyan capitalize">{result.generationType || 'text-to-video'}</span></p>
              <p><strong>Your Prompt:</strong> {result.prompt}</p>
              <p><strong>Status:</strong> <span className="text-neon-yellow capitalize">{result.status}</span></p>
              
              {/* Show input image for image-to-video */}
              {result.generationType === 'image-to-video' && result.inputImage && (
                <div className="mt-4">
                  <p><strong>Source Image:</strong></p>
                  <NextImage
                    src={`data:image/jpeg;base64,${result.inputImage}`}
                    alt="Source image used for video generation"
                    width={500}
                    height={200}
                    className="w-full max-h-48 object-contain rounded-xl border-2 border-electric-blue/50 mt-2"
                    unoptimized
                  />
                </div>
              )}
              
              {result.videoUrl ? (
                <div className="mt-6 space-y-4">
                  <video 
                    controls 
                    className="w-full rounded-xl border-2 border-electric-blue/50"
                    src={result.videoUrl}
                    preload="metadata"
                  >
                    Your browser does not support video playback.
                  </video>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => downloadVideo(result.videoUrl!)}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-summer-cyan to-electric-blue text-void-black font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <Download className="w-5 h-5" />
                      Download Video
                    </button>
                    <a
                      href={result.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-cosmic-pink to-space-purple text-stellar-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <Video className="w-5 h-5" />
                      Open in New Tab
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-6 bg-nebula-gray/30 rounded-xl text-center">
                  <p className="text-stellar-white/70">
                    Video generation completed but no video file was returned.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-stellar-white/60">
          <p className="text-sm">
            Powered by{' '}
            <span className="text-electric-blue font-semibold">Google Gemini Veo</span>
            {' '}• Built with passion for creative technology
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageGeneratorProps {
  onGenerate: (prompt: string) => Promise<void>;
}

export const ImageGenerator = ({ onGenerate }: ImageGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    try {
      const api = new Text2ImageAPI('https://api-key.fusionbrain.ai/', "B4C38C9446A185E0912CC0F84E0E3883", 'B14DF360A5C63F6708882EEB2F781F14');
      const modelId = await api.getModel();
      const uuid = await api.generate(prompt, modelId);
      const images = await api.checkGeneration(uuid);
      
      if (images && images[0]) {
        setGeneratedImage(`data:image/jpeg;base64,${images[0]}`);
        toast.success("Image generated successfully!");
      }
    } catch (error) {
      toast.error("Failed to generate image. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <div className="relative">
          <Input
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-4 text-lg bg-white/5 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-primary/50"
            disabled={isLoading}
          />
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className={cn(
              "mt-4 w-full relative overflow-hidden transition-all duration-200",
              isLoading && "animate-pulse"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner />
                <span className="ml-2">Generating...</span>
              </div>
            ) : (
              "Generate Image"
            )}
          </Button>
        </div>
      </div>

      <div className="relative min-h-[512px] w-full rounded-lg overflow-hidden bg-gray-50/5">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 backdrop-blur-sm">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {generatedImage && !isLoading && (
          <img
            src={generatedImage}
            alt="Generated image"
            className="w-full h-full object-contain animate-fade-in"
          />
        )}
        {!generatedImage && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Your generated image will appear here
          </div>
        )}
      </div>
    </div>
  );
};

const LoadingSpinner = ({ size = "default" }: { size?: "default" | "lg" }) => (
  <div
    className={cn(
      "inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
      size === "lg" ? "h-12 w-12" : "h-4 w-4"
    )}
    role="status"
  >
    <span className="sr-only">Loading...</span>
  </div>
);

// API Class
class Text2ImageAPI {
    constructor(url: string, apiKey: string, secretKey: string) {
        this.url = url;
        this.authHeaders = {
            'X-Key': `Key ${apiKey}`,
            'X-Secret': `Secret ${secretKey}`,
        };
    }

    async getModel() {
        const response = await fetch(`${this.url}key/api/v1/models`, {
            method: 'GET',
            headers: this.authHeaders,
        });
        const data = await response.json();
        return data[0].id;
    }

    async generate(prompt: string, model: string, images = 1, width = 1024, height = 1024) {
        const params = {
            type: "GENERATE",
            numImages: images,
            width: width,
            height: height,
            generateParams: {
                query: prompt,
            },
        };

        const formData = new FormData();
        formData.append('model_id', model);
        formData.append('params', new Blob([JSON.stringify(params)], { type: 'application/json' }));

        const response = await fetch(`${this.url}key/api/v1/text2image/run`, {
            method: 'POST',
            headers: this.authHeaders,
            body: formData,
        });
        const data = await response.json();
        return data.uuid;
    }

    async checkGeneration(requestId: string, attempts = 10, delay = 10000) {
        while (attempts > 0) {
            const response = await fetch(`${this.url}key/api/v1/text2image/status/${requestId}`, {
                method: 'GET',
                headers: this.authHeaders,
            });
            const data = await response.json();
            if (data.status === 'DONE') {
                return data.images;
            }
            attempts--;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        throw new Error('Generation failed or timed out');
    }
}

export default ImageGenerator;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageGeneratorProps {
  onGenerate: (prompt: string) => Promise<void>;
}

class Text2ImageAPI {
  private url: string;
  private authHeaders: { [key: string]: string };

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

export const ImageGenerator = ({ onGenerate }: ImageGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Пожалуйста, введите запрос");
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
        toast.success("Изображение успешно сгенерировано!");
      }
    } catch (error) {
      toast.error("Ошибка при генерации изображения. Попробуйте еще раз.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-8 bg-gradient-to-b from-[#1A1F2C] to-[#403E43] rounded-xl shadow-2xl animate-fade-in">
      <div className="space-y-4">
        <div className="relative">
          <Input
            placeholder="Введите ваш запрос здесь..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-4 text-lg bg-[#222222]/50 backdrop-blur-sm border border-[#8E9196] rounded-lg shadow-sm transition-all duration-300 focus:ring-2 focus:ring-[#8A898C]/50 text-white"
            disabled={isLoading}
          />
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className={cn(
              "mt-4 w-full relative overflow-hidden transition-all duration-300 bg-gradient-to-r from-[#403E43] to-[#1A1F2C] hover:from-[#1A1F2C] hover:to-[#403E43] text-white border border-[#8E9196]",
              isLoading && "animate-pulse"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner />
                <span className="ml-2">Генерация...</span>
              </div>
            ) : (
              "Сгенерировать"
            )}
          </Button>
        </div>
      </div>

      <div className="relative min-h-[512px] w-full rounded-lg overflow-hidden bg-[#222222]/30 backdrop-blur-sm border border-[#8E9196] transition-all duration-300">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#222222]/80 backdrop-blur-sm">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {generatedImage && !isLoading && (
          <img
            src={generatedImage}
            alt="Сгенерированное изображение"
            className="w-full h-full object-contain animate-fade-in"
          />
        )}
        {!generatedImage && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-[#C8C8C9]">
            Здесь появится ваше сгенерированное изображение
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
    <span className="sr-only">Загрузка...</span>
  </div>
);

export default ImageGenerator;


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveImage } from "@/utils/indexedDB";
import AudioManager from "@/utils/audio";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImageGeneratorProps {
  onGenerate: () => Promise<void>;
}

interface KandinskyAPI {
  url: string;
  apiKey: string;
  secretKey: string;
}

// Aspect ratio options
const aspectRatios = [
  { label: "1:1 (Квадрат)", width: 1024, height: 1024 },
  { label: "2:3 (Портрет)", width: 768, height: 1024 },
  { label: "3:2 (Пейзаж)", width: 1024, height: 768 },
  { label: "9:16 (Мобильный)", width: 576, height: 1024 },
  { label: "16:9 (Широкоформатный)", width: 1024, height: 576 },
];

export const ImageGenerator = ({ onGenerate }: ImageGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showFog, setShowFog] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [style, setStyle] = useState("");
  const [styles, setStyles] = useState<{id: string, name: string}[]>([]);

  // Configure API keys for Kandinsky
  const kandinskyApi: KandinskyAPI = {
    url: "https://api-key.fusionbrain.ai/",
    apiKey: "B4C38C9446A185E0912CC0F84E0E3883", // Replace with your actual API key
    secretKey: "B14DF360A5C63F6708882EEB2F781F14", // Replace with your actual Secret key
  };

  // Get available styles when component mounts
  useState(() => {
    fetchStyles();
  });

  // Fetch available style presets
  const fetchStyles = async () => {
    try {
      const response = await fetch(`${kandinskyApi.url}static/styles/key`, {
        headers: {
          'X-Key': `Key ${kandinskyApi.apiKey}`,
          'X-Secret': `Secret ${kandinskyApi.secretKey}`,
        }
      });
      
      if (response.ok) {
        const styleData = await response.json();
        setStyles(styleData);
      }
    } catch (error) {
      console.error("Error fetching styles:", error);
    }
  };

  // Get model ID
  const getModelId = async () => {
    try {
      const response = await fetch(`${kandinskyApi.url}key/api/v1/models`, {
        method: 'GET',
        headers: {
          'X-Key': `Key ${kandinskyApi.apiKey}`,
          'X-Secret': `Secret ${kandinskyApi.secretKey}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data[0].id; // Return the first model ID (Kandinsky 3.1)
    } catch (error) {
      console.error("Error getting model ID:", error);
      throw error;
    }
  };

  // Run image generation
  const generateImage = async (modelId: string) => {
    // Get dimensions based on selected aspect ratio
    const selectedAspect = aspectRatios.find(ratio => ratio.label.startsWith(selectedRatio));
    const width = selectedAspect?.width || 1024;
    const height = selectedAspect?.height || 1024;

    // Prepare parameters
    const params = {
      type: "GENERATE",
      numImages: 1,
      width,
      height,
      style: style || undefined,
      negativePromptDecoder: negativePrompt || undefined,
      generateParams: {
        query: prompt,
      },
    };

    try {
      // Create form data for the request
      const formData = new FormData();
      formData.append('model_id', modelId);
      formData.append('params', new Blob([JSON.stringify(params)], { type: 'application/json' }));

      // Make API request
      const response = await fetch(`${kandinskyApi.url}key/api/v1/text2image/run`, {
        method: 'POST',
        headers: {
          'X-Key': `Key ${kandinskyApi.apiKey}`,
          'X-Secret': `Secret ${kandinskyApi.secretKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.uuid;
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  };

  // Check generation status
  const checkGenerationStatus = async (uuid: string, attempts = 10, delayMs = 2000) => {
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await fetch(`${kandinskyApi.url}key/api/v1/text2image/status/${uuid}`, {
          method: 'GET',
          headers: {
            'X-Key': `Key ${kandinskyApi.apiKey}`,
            'X-Secret': `Secret ${kandinskyApi.secretKey}`,
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'DONE') {
          return data.images;
        } else if (data.status === 'FAIL') {
          throw new Error("Generation failed: " + (data.errorDescription || "Unknown error"));
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } catch (error) {
        console.error("Error checking status:", error);
        throw error;
      }
    }
    throw new Error("Generation timed out");
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Пожалуйста, введите запрос");
      return;
    }

    setIsLoading(true);
    setShowFog(true);
    AudioManager.getInstance().playGenerateSound();
    
    try {
      // Get the model ID
      const modelId = await getModelId();
      
      // Start generation
      const uuid = await generateImage(modelId);
      
      // Poll for results
      const images = await checkGenerationStatus(uuid);
      
      if (images && images[0]) {
        const imageData = `data:image/jpeg;base64,${images[0]}`;
        setGeneratedImage(imageData);
        await saveImage(imageData);
        toast.success("Изображение успешно сгенерировано!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при генерации изображения: " + (error instanceof Error ? error.message : "Неизвестная ошибка"));
    } finally {
      setIsLoading(false);
      setTimeout(() => setShowFog(false), 500);
    }
  };

  return (
    <>
      {showFog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-500 ease-in-out" />
      )}
      <div className="w-full max-w-3xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8 bg-gradient-to-b from-[#1A1F2C] to-[#403E43] rounded-xl shadow-2xl animate-fade-in transition-all duration-300 ease-in-out relative z-50">
        <div className="space-y-4">
          {/* Main prompt field */}
          <div className="relative">
            <Textarea
              placeholder="Введите ваш запрос здесь..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 md:p-4 text-base md:text-lg bg-[#222222]/50 backdrop-blur-sm border border-[#8E9196] rounded-lg shadow-sm transition-all duration-300 focus:ring-2 focus:ring-[#8A898C]/50 text-white min-h-[100px]"
              disabled={isLoading}
            />
          </div>

          {/* Generation Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Negative prompt field */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">Негативный промпт</label>
              <Textarea
                placeholder="Что исключить из генерации..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="w-full p-3 text-sm bg-[#222222]/50 backdrop-blur-sm border border-[#8E9196] rounded-lg shadow-sm transition-all duration-300 focus:ring-2 focus:ring-[#8A898C]/50 text-white min-h-[80px]"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-4">
              {/* Aspect ratio selector */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Соотношение сторон</label>
                <Select
                  disabled={isLoading}
                  value={selectedRatio}
                  onValueChange={setSelectedRatio}
                >
                  <SelectTrigger className="bg-[#222222]/50 backdrop-blur-sm border border-[#8E9196] text-white">
                    <SelectValue placeholder="Выберите соотношение" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#222222] border border-[#8E9196] text-white">
                    {aspectRatios.map((ratio) => (
                      <SelectItem key={ratio.label} value={ratio.label.split(' ')[0]}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Style selector */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Стиль (опционально)</label>
                <Select
                  disabled={isLoading}
                  value={style}
                  onValueChange={setStyle}
                >
                  <SelectTrigger className="bg-[#222222]/50 backdrop-blur-sm border border-[#8E9196] text-white">
                    <SelectValue placeholder="Выберите стиль" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#222222] border border-[#8E9196] text-white max-h-[200px] overflow-y-auto">
                    <SelectItem value="">Без стиля</SelectItem>
                    {styles.map((styleItem) => (
                      <SelectItem key={styleItem.id} value={styleItem.id}>
                        {styleItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className={cn(
              "mt-4 w-full relative overflow-hidden transition-all duration-300 bg-gradient-to-r from-[#403E43] to-[#1A1F2C] hover:from-[#1A1F2C] hover:to-[#403E43] text-white border border-[#8E9196] transform hover:scale-[1.02]",
              isLoading && "animate-pulse"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <TsunamiSpinner />
                <span className="ml-2">Генерация...</span>
              </div>
            ) : (
              "Сгенерировать"
            )}
          </Button>
        </div>

        <div className="relative min-h-[300px] md:min-h-[512px] w-full rounded-lg overflow-hidden bg-[#222222]/30 backdrop-blur-sm border border-[#8E9196] transition-all duration-300">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#222222]/80 backdrop-blur-sm">
              <TsunamiSpinner size="lg" />
            </div>
          )}
          {generatedImage && !isLoading && (
            <img
              src={generatedImage}
              alt="Сгенерированное изображение"
              className="w-full h-full object-contain animate-[fadeIn_1s_ease-in-out] transition-all duration-500"
            />
          )}
          {!generatedImage && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-[#C8C8C9] p-4 text-center">
              Здесь появится ваше сгенерированное изображение
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const TsunamiSpinner = ({ size = "default" }: { size?: "default" | "lg" }) => (
  <div
    className={cn(
      "relative",
      size === "lg" ? "w-24 h-24" : "w-8 h-8"
    )}
  >
    <div className={cn(
      "absolute inset-0 rounded-full border-4 border-blue-500/30",
      "animate-[spin_3s_linear_infinite]"
    )}>
      <div className="absolute inset-0 transform rotate-45">
        <div className={cn(
          "absolute inset-0 rounded-full border-4 border-transparent",
          "border-t-blue-500 border-r-blue-500",
          "animate-[wave_2s_ease-in-out_infinite]"
        )} />
      </div>
    </div>
    <div className={cn(
      "absolute inset-0 rounded-full border-4 border-transparent",
      "border-t-blue-500",
      "animate-[spin_1.5s_linear_infinite]"
    )} />
  </div>
);

export default ImageGenerator;

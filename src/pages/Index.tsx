import ImageGenerator from "@/components/ImageGenerator";
import ImageGallery from "@/components/ImageGallery";
import Snowfall from "@/components/Snowfall";
import LoadingScreen from "@/components/LoadingScreen";
import { Telegram } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#1A1F2C] to-[#403E43] text-white py-6 md:py-12">
      <LoadingScreen />
      <Snowfall />
      <ImageGallery />
      <div className="container mx-auto px-4 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 md:mb-8 animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-[#C8C8C9] to-white">
          AK PROJECT
        </h1>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="max-w-xl mx-auto text-center mb-8 md:mb-12 animate-fade-in delay-100 cursor-help">
                <p className="text-[#8E9196] text-sm md:text-base">
                  Создавайте уникальные изображения с помощью искусственного интеллекта
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1A1F2C] text-white border-[#8E9196] max-w-xs">
              <p>Введите описание желаемого изображения и нажмите кнопку "Сгенерировать"</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ImageGenerator onGenerate={async () => {}} />

        <footer className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 bg-[#1A1F2C]/50 px-4 py-2 rounded-full backdrop-blur-sm border border-[#8E9196]/30 animate-fade-in hover:scale-105 transition-transform">
            <span className="text-[#C8C8C9]">Created by</span>
            <span className="font-bold bg-gradient-to-r from-[#9b87f5] to-[#D6BCFA] text-transparent bg-clip-text animate-pulse">
              TETRIXUNO
            </span>
            <a
              href="https://t.me/TETRIX_UNO"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-[#aaadb0] hover:text-white transition-colors"
            >
              <Telegram className="w-4 h-4" />
              <span>@TETRIX_UNO</span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
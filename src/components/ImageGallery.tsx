import { useEffect, useState } from "react";
import { getAllImages } from "@/utils/indexedDB";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ImageIcon, MoreVertical, Download, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SavedImage {
  id: number;
  data: string;
  timestamp: string;
}

const ImageGallery = () => {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadImages();
    const interval = setInterval(loadImages, 2000); // Auto refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const loadImages = async () => {
    try {
      setIsRefreshing(true);
      const savedImages = await getAllImages() as SavedImage[];
      setImages(savedImages);
    } catch (error) {
      toast.error("Ошибка при загрузке изображений");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = (imageData: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `generated-image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Изображение успешно скачано!");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="fixed right-4 top-4 z-50 md:flex items-center gap-2 bg-white/10 backdrop-blur-sm border-[#8E9196] text-white hover:bg-white/20"
        >
          <MoreVertical className="w-4 h-4 md:hidden" />
          <ImageIcon className="hidden md:block w-4 h-4" />
          <span className="hidden md:inline">Галерея</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-[#1A1F2C]/95 backdrop-blur-lg border-[#8E9196] text-white">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center justify-between">
            Галерея изображений
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            Все сгенерированные изображения
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {images.length === 0 ? (
            <p className="text-center text-gray-400">Нет сохраненных изображений</p>
          ) : (
            images.map((image, index) => (
              <div
                key={image.id}
                className="relative group rounded-lg overflow-hidden border border-[#8E9196]/50"
              >
                <img
                  src={image.data}
                  alt={`Generated ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    onClick={() => handleDownload(image.data, index)}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Скачать
                  </Button>
                </div>
                <div className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                  {new Date(image.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ImageGallery;
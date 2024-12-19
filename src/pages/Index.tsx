import ImageGenerator from "@/components/ImageGenerator";
import Snowfall from "@/components/Snowfall";
import LoadingScreen from "@/components/LoadingScreen";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#1A1F2C] to-[#403E43] text-white py-6 md:py-12">
      <LoadingScreen />
      <Snowfall />
      <div className="container mx-auto px-4 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 md:mb-8 animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-[#C8C8C9] to-white">
          AK PROJECT
        </h1>
        <div className="max-w-xl mx-auto text-center mb-8 md:mb-12 animate-fade-in delay-100">
          <p className="text-[#8E9196] text-sm md:text-base">
            Создавайте уникальные изображения с помощью искусственного интеллекта
          </p>
        </div>
        <ImageGenerator onGenerate={async () => {}} />
      </div>
    </div>
  );
};

export default Index;
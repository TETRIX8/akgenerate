import ImageGenerator from "@/components/ImageGenerator";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 animate-fade-in">AI Image Generator</h1>
        <ImageGenerator onGenerate={async () => {}} />
      </div>
    </div>
  );
};

export default Index;
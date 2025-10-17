import { useState } from "react";
import NovelGenerator from "@/components/NovelGenerator";
import NovelDisplay from "@/components/NovelDisplay";

const Index = () => {
  const [generatedNovel, setGeneratedNovel] = useState<string>("");

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto flex flex-col items-center gap-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-glow">
            카카오 웹소설 AI 작가
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            최첨단 AI 기술로 당신만의 웹소설을 몇 초 만에 완성하세요
          </p>
        </div>

        <NovelGenerator onNovelGenerated={setGeneratedNovel} />

        {generatedNovel && (
          <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <NovelDisplay novel={generatedNovel} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

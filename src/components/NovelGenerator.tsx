import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NovelGeneratorProps {
  onNovelGenerated: (novel: string) => void;
}

export default function NovelGenerator({ onNovelGenerated }: NovelGeneratorProps) {
  const [genre, setGenre] = useState("");
  const [theme, setTheme] = useState("");
  const [characters, setCharacters] = useState("");
  const [length, setLength] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!genre || !theme || !characters) {
      toast({
        title: "입력 필요",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-novel', {
        body: { genre, theme, characters, length }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      onNovelGenerated(data.novel);
      toast({
        title: "생성 완료",
        description: "웹소설이 성공적으로 생성되었습니다!",
      });
    } catch (error) {
      console.error('Error generating novel:', error);
      toast({
        title: "생성 실패",
        description: error instanceof Error ? error.message : "웹소설 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl gradient-card border-primary/20 shadow-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          <Sparkles className="w-8 h-8 text-primary animate-glow" />
          웹소설 자동 생성기
        </CardTitle>
        <CardDescription className="text-muted-foreground text-base">
          AI가 당신만의 웹소설을 작성해드립니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="genre" className="text-foreground font-medium">장르</Label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger id="genre" className="bg-input border-primary/30 focus:border-primary">
              <SelectValue placeholder="장르를 선택하세요" />
            </SelectTrigger>
            <SelectContent className="bg-card border-primary/30">
              <SelectItem value="fantasy">판타지</SelectItem>
              <SelectItem value="romance">로맨스</SelectItem>
              <SelectItem value="modern-fantasy">현대 판타지</SelectItem>
              <SelectItem value="martial-arts">무협</SelectItem>
              <SelectItem value="mystery">미스터리</SelectItem>
              <SelectItem value="sci-fi">SF</SelectItem>
              <SelectItem value="horror">공포/스릴러</SelectItem>
              <SelectItem value="school">학원물</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme" className="text-foreground font-medium">주제/배경</Label>
          <Input
            id="theme"
            placeholder="예: 현대 서울에서 펼쳐지는 마법사들의 이야기"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-input border-primary/30 focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="characters" className="text-foreground font-medium">등장인물</Label>
          <Textarea
            id="characters"
            placeholder="예: 주인공 - 평범한 대학생이지만 숨겨진 힘을 가진 김지우
조연 - 신비로운 마법사 박서연"
            value={characters}
            onChange={(e) => setCharacters(e.target.value)}
            className="bg-input border-primary/30 focus:border-primary min-h-24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="length" className="text-foreground font-medium">분량</Label>
          <Select value={length} onValueChange={setLength}>
            <SelectTrigger id="length" className="bg-input border-primary/30 focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-primary/30">
              <SelectItem value="short">짧게 (1,000자)</SelectItem>
              <SelectItem value="medium">보통 (2,500자)</SelectItem>
              <SelectItem value="long">길게 (5,000자+)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full h-12 text-lg font-semibold gradient-primary hover:opacity-90 transition-opacity shadow-glow"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              소설 생성 중...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              웹소설 생성하기
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

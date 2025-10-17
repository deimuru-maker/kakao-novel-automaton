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
  const [episodeCount, setEpisodeCount] = useState("1");
  const [synopsis, setSynopsis] = useState("");
  const [length, setLength] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!synopsis || !episodeCount) {
      toast({
        title: "입력 필요",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const count = parseInt(episodeCount);
    if (isNaN(count) || count < 1 || count > 10) {
      toast({
        title: "잘못된 입력",
        description: "에피소드 수는 1~10 사이로 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-novel', {
        body: { 
          genre: "로맨스 판타지",
          synopsis, 
          episodeCount: count, 
          length 
        }
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
          <Label className="text-foreground font-medium">장르</Label>
          <div className="px-3 py-2 bg-primary/10 border border-primary/30 rounded-md">
            <span className="text-foreground">로맨스 판타지</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="episodeCount" className="text-foreground font-medium">몇 화를 쓸 건지</Label>
          <Input
            id="episodeCount"
            type="number"
            min="1"
            max="10"
            placeholder="1~10 사이의 숫자"
            value={episodeCount}
            onChange={(e) => setEpisodeCount(e.target.value)}
            className="bg-input border-primary/30 focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="synopsis" className="text-foreground font-medium">어떤 내용으로 쓸 건지</Label>
          <Textarea
            id="synopsis"
            placeholder="예: 평범한 회사원 주인공이 어느 날 이세계로 떨어져 황태자와 사랑에 빠지는 이야기. 주인공은 현대 지식을 활용해 위기를 극복하고, 황태자는 처음엔 차갑지만 점점 마음을 열어간다."
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            className="bg-input border-primary/30 focus:border-primary min-h-32"
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

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Episode {
  episode_number: number;
  title: string;
  content: string;
}

interface StoryCoachingProps {
  novelId: string;
  synopsis: string;
  previousEpisodes: Episode[];
  onSelectSuggestion: (suggestion: string) => void;
}

export default function StoryCoaching({ synopsis, previousEpisodes, onSelectSuggestion }: StoryCoachingProps) {
  const [suggestions, setSuggestions] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setIsLoading(true);

    try {
      const episodeSummaries = previousEpisodes.map(ep => ({
        episode_number: ep.episode_number,
        title: ep.title,
        summary: ep.content.substring(0, 300)
      }));

      const { data, error } = await supabase.functions.invoke('suggest-next', {
        body: {
          synopsis,
          episodes: episodeSummaries
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuggestions(data.suggestions);
      toast({
        title: "추천 완료",
        description: "다음 화 전개 방향을 확인해보세요!",
      });
    } catch (error) {
      toast({
        title: "추천 실패",
        description: error instanceof Error ? error.message : "오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseSuggestions = (text: string) => {
    const suggestions = [];
    const lines = text.split('\n');
    let currentSuggestion = { title: '', content: '' };

    for (const line of lines) {
      if (line.startsWith('**제안')) {
        if (currentSuggestion.title) {
          suggestions.push(currentSuggestion);
        }
        currentSuggestion = { title: line.replace(/\*\*/g, ''), content: '' };
      } else if (line.trim() && currentSuggestion.title) {
        currentSuggestion.content += line + '\n';
      }
    }
    
    if (currentSuggestion.title) {
      suggestions.push(currentSuggestion);
    }

    return suggestions;
  };

  return (
    <Card className="gradient-card border-primary/20 shadow-glow sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Lightbulb className="w-5 h-5 text-primary" />
          스토리 코칭
        </CardTitle>
        <CardDescription>
          다음 화 전개를 AI가 추천해드립니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleGetSuggestions}
          disabled={isLoading || previousEpisodes.length === 0}
          className="w-full gradient-primary hover:opacity-90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <Lightbulb className="mr-2 h-4 w-4" />
              전개 추천받기
            </>
          )}
        </Button>

        {suggestions && (
          <div className="space-y-3 pt-4 border-t border-primary/20">
            {parseSuggestions(suggestions).map((suggestion, index) => (
              <Card key={index} className="bg-card/50 border-primary/10">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {suggestion.content}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectSuggestion(suggestion.content.trim())}
                    className="w-full text-xs"
                  >
                    이 방향으로 쓰기
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {previousEpisodes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            첫 에피소드 작성 후 추천을 받을 수 있습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}

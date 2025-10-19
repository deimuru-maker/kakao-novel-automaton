import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StoryCoaching from "./StoryCoaching";

interface Novel {
  id: string;
  title: string;
  synopsis: string;
}

interface Episode {
  episode_number: number;
  title: string;
  content: string;
}

export default function EpisodeWriter() {
  const { id: novelId, episodeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [novel, setNovel] = useState<Novel | null>(null);
  const [previousEpisodes, setPreviousEpisodes] = useState<Episode[]>([]);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [length, setLength] = useState("medium");
  const [direction, setDirection] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (novelId) {
      fetchNovelData();
    }
  }, [novelId]);

  const fetchNovelData = async () => {
    try {
      const numberParam = searchParams.get('number');
      const targetEpisodeNumber = numberParam ? parseInt(numberParam) : 1;

      const [novelResult, episodesResult] = await Promise.all([
        supabase.from('novels').select('*').eq('id', novelId).single(),
        supabase.from('episodes').select('*').eq('novel_id', novelId).order('episode_number', { ascending: true })
      ]);

      if (novelResult.error) throw novelResult.error;
      if (episodesResult.error) throw episodesResult.error;

      setNovel(novelResult.data);
      setPreviousEpisodes(episodesResult.data || []);
      setEpisodeNumber(targetEpisodeNumber);
    } catch (error) {
      toast({
        title: "불러오기 실패",
        description: error instanceof Error ? error.message : "오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!novel) return;

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-episode', {
        body: {
          synopsis: novel.synopsis,
          episodeNumber,
          length,
          direction: direction || undefined,
          previousEpisodes: previousEpisodes.map(ep => ({
            episode_number: ep.episode_number,
            title: ep.title,
            content: ep.content
          }))
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const episode = data.episode;
      const lines = episode.split('\n');
      
      let title = "";
      let content = "";
      let contentStartIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`${episodeNumber}화:`)) {
          title = lines[i].replace(`${episodeNumber}화:`, '').trim();
          contentStartIndex = i + 1;
          while (contentStartIndex < lines.length && lines[contentStartIndex].trim() === '') {
            contentStartIndex++;
          }
          break;
        }
      }

      content = lines.slice(contentStartIndex).join('\n').trim();

      setGeneratedTitle(title);
      setGeneratedContent(content);

      toast({
        title: "생성 완료",
        description: "에피소드가 생성되었습니다!",
      });
    } catch (error) {
      toast({
        title: "생성 실패",
        description: error instanceof Error ? error.message : "오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!novel || !generatedTitle || !generatedContent) {
      toast({
        title: "저장 실패",
        description: "먼저 에피소드를 생성해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const summary = generatedContent.substring(0, 200);

      const { error: episodeError } = await supabase
        .from('episodes')
        .insert({
          novel_id: novel.id,
          episode_number: episodeNumber,
          title: generatedTitle,
          content: generatedContent,
          summary,
        });

      if (episodeError) throw episodeError;

      const { error: novelError } = await supabase
        .from('novels')
        .update({ current_episode_count: episodeNumber })
        .eq('id', novel.id);

      if (novelError) throw novelError;

      toast({
        title: "저장 완료",
        description: `${episodeNumber}화가 저장되었습니다!`,
      });

      navigate(`/novel/${novel.id}`);
    } catch (error) {
      toast({
        title: "저장 실패",
        description: error instanceof Error ? error.message : "오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-muted-foreground">작품을 찾을 수 없습니다</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/novel/${novel.id}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          작품으로 돌아가기
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="gradient-card border-primary/20 shadow-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  <Sparkles className="w-6 h-6 text-primary animate-glow" />
                  {episodeNumber}화 작성하기
                </CardTitle>
                <CardDescription>
                  {novel.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="length">분량</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger id="length" className="bg-input border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-primary/30">
                      <SelectItem value="short">짧게 (1,000자)</SelectItem>
                      <SelectItem value="medium">보통 (2,500자)</SelectItem>
                      <SelectItem value="long">길게 (5,000자+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direction">전개 방향 (선택)</Label>
                  <Textarea
                    id="direction"
                    placeholder="예: 주인공과 황태자가 처음으로 단둘이 대화하는 장면"
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="bg-input border-primary/30 focus:border-primary min-h-24"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full gradient-primary hover:opacity-90"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      에피소드 생성하기
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {generatedContent && (
              <Card className="gradient-card border-primary/20">
                <CardHeader>
                  <CardTitle>{generatedTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-foreground">{generatedContent}</div>
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full mt-6 gradient-primary hover:opacity-90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        저장하기
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <StoryCoaching
              novelId={novel.id}
              synopsis={novel.synopsis}
              previousEpisodes={previousEpisodes}
              onSelectSuggestion={(suggestion) => setDirection(suggestion)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

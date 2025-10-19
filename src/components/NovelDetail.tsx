import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Novel {
  id: string;
  title: string;
  synopsis: string;
  current_episode_count: number;
}

interface Episode {
  id: string;
  episode_number: number;
  title: string;
  content: string;
  created_at: string;
}

export default function NovelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNovelAndEpisodes();
    }
  }, [id]);

  const fetchNovelAndEpisodes = async () => {
    try {
      const [novelResult, episodesResult] = await Promise.all([
        supabase.from('novels').select('*').eq('id', id).single(),
        supabase.from('episodes').select('*').eq('novel_id', id).order('episode_number', { ascending: true })
      ]);

      if (novelResult.error) throw novelResult.error;
      if (episodesResult.error) throw episodesResult.error;

      setNovel(novelResult.data);
      setEpisodes(episodesResult.data || []);
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

  const handleWriteNext = () => {
    const nextEpisodeNumber = episodes.length + 1;
    navigate(`/novel/${id}/episode/new?number=${nextEpisodeNumber}`);
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
      <div className="container mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          작품 목록으로
        </Button>

        <Card className="gradient-card border-primary/20 shadow-glow mb-8">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {novel.title}
            </CardTitle>
            <CardDescription className="text-base mt-4">
              {novel.synopsis}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                총 {episodes.length}화
              </span>
              <Button onClick={handleWriteNext} className="gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                {episodes.length === 0 ? "1화 쓰기" : `${episodes.length + 1}화 쓰기`}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">에피소드 목록</h2>
          {episodes.length === 0 ? (
            <Card className="gradient-card border-primary/20">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-4">
                  아직 에피소드가 없습니다
                </p>
                <Button onClick={handleWriteNext} className="gradient-primary">
                  첫 에피소드 작성하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {episodes.map((episode) => (
                <Card
                  key={episode.id}
                  className="gradient-card border-primary/20 hover:shadow-glow transition-all cursor-pointer"
                  onClick={() => navigate(`/novel/${id}/episode/${episode.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {episode.episode_number}화: {episode.title}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {episode.content.substring(0, 100)}...
                        </CardDescription>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                        {new Date(episode.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

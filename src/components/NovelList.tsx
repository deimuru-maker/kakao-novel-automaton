import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Novel {
  id: string;
  title: string;
  synopsis: string;
  current_episode_count: number;
  updated_at: string;
}

export default function NovelList() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNovels();
  }, []);

  const fetchNovels = async () => {
    try {
      const { data, error } = await supabase
        .from('novels')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNovels(data || []);
    } catch (error) {
      toast({
        title: "작품 불러오기 실패",
        description: error instanceof Error ? error.message : "오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "로그아웃되었습니다" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              내 작품
            </h1>
            <p className="text-muted-foreground">연재 중인 웹소설을 관리하세요</p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>

        <Button
          onClick={() => navigate("/novel/new")}
          className="mb-6 gradient-primary hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          새 작품 시작하기
        </Button>

        {novels.length === 0 ? (
          <Card className="gradient-card border-primary/20">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-4">
                아직 작품이 없습니다
              </p>
              <Button onClick={() => navigate("/novel/new")} className="gradient-primary">
                첫 작품 시작하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {novels.map((novel) => (
              <Card
                key={novel.id}
                className="gradient-card border-primary/20 hover:shadow-glow transition-all cursor-pointer"
                onClick={() => navigate(`/novel/${novel.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-xl">{novel.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {novel.synopsis}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{novel.current_episode_count}화</span>
                    <span>{new Date(novel.updated_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function CreateNovel() {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !synopsis) {
      toast({
        title: "입력 필요",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const { data, error } = await supabase
        .from('novels')
        .insert({
          user_id: user.id,
          title,
          synopsis,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "작품 생성 완료",
        description: "이제 첫 에피소드를 작성해보세요!",
      });

      navigate(`/novel/${data.id}`);
    } catch (error) {
      toast({
        title: "작품 생성 실패",
        description: error instanceof Error ? error.message : "오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          작품 목록으로
        </Button>

        <Card className="gradient-card border-primary/20 shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              <Sparkles className="w-8 h-8 text-primary animate-glow" />
              새 작품 시작하기
            </CardTitle>
            <CardDescription className="text-base">
              작품의 기본 정보를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground font-medium">
                  작품 제목
                </Label>
                <Input
                  id="title"
                  placeholder="예: 황태자의 계약 연인"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-input border-primary/30 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="synopsis" className="text-foreground font-medium">
                  전체 줄거리
                </Label>
                <Textarea
                  id="synopsis"
                  placeholder="예: 평범한 회사원 주인공이 어느 날 이세계로 떨어져 황태자와 사랑에 빠지는 이야기. 주인공은 현대 지식을 활용해 위기를 극복하고, 황태자는 처음엔 차갑지만 점점 마음을 열어간다."
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="bg-input border-primary/30 focus:border-primary min-h-40"
                />
                <p className="text-sm text-muted-foreground">
                  전체 줄거리는 AI가 각 에피소드를 작성할 때 참고합니다
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 gradient-primary hover:opacity-90"
                >
                  {loading ? "생성 중..." : "작품 만들기"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

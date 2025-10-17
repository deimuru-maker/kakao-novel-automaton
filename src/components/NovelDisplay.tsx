import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NovelDisplayProps {
  novel: string;
}

export default function NovelDisplay({ novel }: NovelDisplayProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(novel);
    toast({
      title: "복사 완료",
      description: "웹소설이 클립보드에 복사되었습니다.",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([novel], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '웹소설.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "다운로드 완료",
      description: "웹소설이 다운로드되었습니다.",
    });
  };

  // 제목과 본문 분리
  const lines = novel.split('\n');
  let title = "";
  let content = novel;

  if (lines[0]?.startsWith('제목:')) {
    title = lines[0].replace('제목:', '').trim();
    content = lines.slice(1).join('\n').trim();
  }

  return (
    <Card className="w-full max-w-4xl gradient-card border-primary/20 shadow-soft">
      <CardHeader className="border-b border-primary/20 pb-6">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-2xl md:text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex-1">
            {title || "생성된 웹소설"}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="border-primary/30 hover:bg-primary/10"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDownload}
              className="border-primary/30 hover:bg-primary/10"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="whitespace-pre-wrap text-foreground leading-relaxed">
            {content}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

-- Create novels table for storing novel projects
CREATE TABLE public.novels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  genre TEXT DEFAULT '로맨스 판타지',
  settings JSONB DEFAULT '{}',
  characters JSONB DEFAULT '[]',
  current_episode_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create episodes table for storing individual episodes
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(novel_id, episode_number)
);

-- Enable RLS
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for novels
CREATE POLICY "Users can view their own novels"
  ON public.novels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own novels"
  ON public.novels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own novels"
  ON public.novels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own novels"
  ON public.novels FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for episodes
CREATE POLICY "Users can view episodes of their novels"
  ON public.episodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.novels
      WHERE novels.id = episodes.novel_id
      AND novels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create episodes for their novels"
  ON public.episodes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.novels
      WHERE novels.id = episodes.novel_id
      AND novels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update episodes of their novels"
  ON public.episodes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.novels
      WHERE novels.id = episodes.novel_id
      AND novels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete episodes of their novels"
  ON public.episodes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.novels
      WHERE novels.id = episodes.novel_id
      AND novels.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_novels_updated_at
  BEFORE UPDATE ON public.novels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_episodes_updated_at
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_novels_user_id ON public.novels(user_id);
CREATE INDEX idx_episodes_novel_id ON public.episodes(novel_id);
CREATE INDEX idx_episodes_episode_number ON public.episodes(episode_number);
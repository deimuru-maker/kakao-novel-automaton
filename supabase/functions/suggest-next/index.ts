const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestRequest {
  synopsis: string;
  episodes: Array<{ episode_number: number; title: string; summary: string }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { synopsis, episodes }: SuggestRequest = await req.json();
    
    console.log('Suggesting next episode with:', { synopsis, episodeCount: episodes.length });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const episodeContext = episodes.map(ep => 
      `${ep.episode_number}화 "${ep.title}": ${ep.summary}`
    ).join('\n');

    const systemPrompt = `당신은 로맨스 판타지 소설 전문 스토리 코치입니다. 작가가 다음 화를 쓸 수 있도록 구체적이고 매력적인 전개 방향을 제안합니다.`;

    const userPrompt = `다음은 지금까지의 작품 정보입니다:

전체 줄거리: ${synopsis}

지금까지 작성된 에피소드:
${episodeContext}

다음 ${episodes.length + 1}화를 위한 전개 방향을 3가지 제안해주세요. 각 제안은 다음 형식으로 작성해주세요:

**제안 1: [제목]**
[구체적인 전개 내용 2-3문장]
- 핵심 포인트 1
- 핵심 포인트 2

각 제안은 로맨스 판타지 장르의 매력을 살리고, 이전 화의 흐름을 자연스럽게 이어가며, 독자의 흥미를 끌 수 있는 전개여야 합니다.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: '크레딧이 부족합니다. 크레딧을 충전해주세요.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI 생성 실패');
    }

    const data = await response.json();
    const suggestions = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-next function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

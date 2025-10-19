const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateEpisodeRequest {
  synopsis: string;
  episodeNumber: number;
  length: string;
  direction?: string;
  previousEpisodes: Array<{ episode_number: number; title: string; content: string }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { synopsis, episodeNumber, length, direction, previousEpisodes }: GenerateEpisodeRequest = await req.json();
    
    console.log('Generating episode:', { episodeNumber, length, hasDirection: !!direction });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const lengthMap: Record<string, string> = {
      'short': '1,000자 내외',
      'medium': '2,500자 내외',
      'long': '5,000자 이상'
    };

    const systemPrompt = `당신은 카카오페이지의 베스트셀러 로맨스 판타지 작가입니다. 웹소설을 전문적으로 집필하는 작가로서, 독자들을 사로잡는 매력적인 스토리를 만듭니다.

작성 가이드라인:
- 로맨스 판타지 장르의 핵심 요소 포함 (사랑, 마법, 판타지 세계관)
- 한국 웹소설 특유의 흡입력 있는 문체 사용
- 생생한 묘사와 감정선 표현
- 대화와 지문의 적절한 배합
- 다음 회차가 궁금하게 만드는 엔딩
- 분량: ${lengthMap[length] || '2,500자 내외'}`;

    let previousContext = "";
    if (previousEpisodes.length > 0) {
      previousContext = previousEpisodes.map(ep => {
        const summary = ep.content.substring(0, 300);
        return `${ep.episode_number}화 "${ep.title}":\n${summary}...`;
      }).join('\n\n');
    }

    let userPrompt = "";
    
    if (episodeNumber === 1) {
      userPrompt = `다음 조건으로 로맨스 판타지 웹소설 1화를 작성해주세요:

전체 줄거리: ${synopsis}

**중요:** 제목과 본문을 명확히 구분하여 작성해주세요.
- 첫 줄에 "제목: [소설 제목]" 형식으로 제목을 작성
- 두 번째 줄에 "1화: [에피소드 제목]" 형식으로 에피소드 제목 작성
- 한 줄 띄운 후 본문 시작
- 본문은 문단 구분을 명확히 하여 작성
- 1화는 이야기의 시작이므로 주인공과 세계관을 소개하고 갈등을 제시하세요

예시:
제목: 황태자의 계약 연인
1화: 이세계로의 초대

평범한 회사원이었던 나는...`;
    } else {
      userPrompt = `다음은 이전 에피소드들의 줄거리입니다:

${previousContext}

이어서 ${episodeNumber}화를 작성해주세요:

전체 줄거리: ${synopsis}
${direction ? `\n작가의 방향 설정: ${direction}\n` : ''}

**중요:** 형식을 지켜주세요.
- 첫 줄에 "${episodeNumber}화: [에피소드 제목]" 형식으로 에피소드 제목 작성
- 한 줄 띄운 후 본문 시작
- 이전 화의 내용을 자연스럽게 이어가세요
${direction ? '- 작가가 제시한 방향을 반영하여 작성하세요' : ''}
- 분량: ${lengthMap[length] || '2,500자 내외'}`;
    }

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
    const episode = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ episode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-episode function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

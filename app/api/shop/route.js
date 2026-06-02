import Anthropic from '@anthropic-ai/sdk';
import { RECIPES } from '../../recipes';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req) {
  try {
    const { haveIngredients, selectedRecipeIds } = await req.json();

    const selectedRecipes = RECIPES.filter(r => selectedRecipeIds.includes(r.id));
    const recipesText = selectedRecipes.map(r =>
      '[' + r.title + '] 재료: ' + r.ingredients.join(', ')
    ).join('\n');

    const systemPrompt = '당신은 똑똑한 장보기 도우미입니다. 사용자가 선택한 레시피들을 만들기 위해 부족한 재료만 장보기 리스트로 만들어 주세요.\n\n사용자가 이미 가진 재료: ' + haveIngredients + '\n\n선택한 레시피들:\n' + recipesText + '\n\n규칙:\n1. 같은 재료가 여러 레시피에 나오면 한 번만 리스트에 넣기 (양은 합치기)\n2. 사용자가 가진 재료는 제외 (예: 닭고기 가졌으면 닭다리살, 닭가슴살도 제외)\n3. 소금, 후추, 식용유, 물 같은 기본 재료는 보통 집에 있으니 제외\n4. 양념(고추장, 간장, 참기름 등)도 보통 집에 있으니 제외, 단 사용자가 안 가졌다고 명시하면 포함\n\n응답은 반드시 다음 JSON 형식으로만 답변하세요 (다른 텍스트 없이):\n{"items": ["재료1 (분량)", "재료2 (분량)", "재료3 (분량)"]}';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: '장보기 리스트를 만들어주세요.' }]
    });

    let text = response.content[0].text.trim();
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(text);

    return Response.json(parsed);
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
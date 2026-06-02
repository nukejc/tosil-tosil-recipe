import Anthropic from '@anthropic-ai/sdk';
import { RECIPES } from '../../recipes';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const RECIPE_TEXT = RECIPES.map(r =>
  '[' + r.id + '] ' + r.title + ' (' + r.category + ') - 재료: ' + r.ingredients.join(', ')
).join('\n');

export async function POST(req) {
  try {
    const { ingredients } = await req.json();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      system: '당신은 레시피 도우미입니다. 사용자가 가진 재료를 보고, 그 재료를 활용해서 만들 수 있거나 메인으로 쓸 수 있는 레시피의 ID를 찾아주세요.\n\n레시피 목록:\n' + RECIPE_TEXT + '\n\n규칙:\n1. 사용자가 명시한 주재료(고기, 면 등)가 핵심 재료로 들어가는 레시피를 우선 추천\n2. 양념, 채소만 추가하면 만들 수 있는 레시피도 포함\n3. 추천할 레시피가 많아도 최대 10개까지\n\n응답은 반드시 다음 JSON 형식으로만 답변하세요 (다른 텍스트 없이):\n{"recipe_ids": [1, 5, 12]}',
      messages: [{ role: 'user', content: '집에 있는 재료: ' + ingredients }]
    });

    let text = message.content[0].text.trim();
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(text);

    return Response.json(parsed);
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
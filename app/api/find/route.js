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
      max_tokens: 1000,
      system: '당신은 가족 레시피 앱의 따뜻한 AI 도우미입니다. 사용자가 가진 재료로 만들 수 있는 레시피를 아래 목록에서 찾아 추천하세요.\n\n레시피 목록:\n' + RECIPE_TEXT + '\n\n응답 형식:\n- 만들 수 있는 레시피: [번호들, 쉼표로 구분]\n- 이유를 1-2줄로 친근하게 설명\n- 부족한 재료가 있으면 언급\n\n반드시 한국어로 답변하세요.',
      messages: [{ role: 'user', content: '집에 있는 재료: ' + ingredients }]
    });

    const text = message.content[0].text;
    const ids = [...text.matchAll(/\[(\d+(?:,\s*\d+)*)\]/g)]
      .flatMap(m => m[1].split(',').map(n => parseInt(n.trim())));
    const matched = [...new Set(ids)];
    const cleanText = text.replace(/\[[\d,\s]+\]/g, '').trim();

    return Response.json({ text: cleanText, matched });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
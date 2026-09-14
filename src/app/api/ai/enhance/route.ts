import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text string is required' }, { status: 400 });
    }

    const trimmed = text.trim();

    // Check environment variables for Gemini API key if available
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `You are a Senior Regulatory Business Analyst. Rewrite and polish the following text into professional, logical, crisp, and concise regulatory documentation language suitable for a UK CAIS High-Level Design document.

RULES:
1. Maintain the EXACT SAME facts, figures, product codes, dates, brand names, and technical logic.
2. Do NOT invent or add any new facts, figures, assumptions, or claims not present in the draft.
3. Improve clarity, grammar, flow, and professional tone.
4. Output ONLY the polished text with no surrounding markdown explanations or quotes.

DRAFT TEXT:
${trimmed}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1000 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const enhanced = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (enhanced) {
            return NextResponse.json({ enhancedText: enhanced });
          }
        }
      } catch (e) {
        console.error('Gemini API call failed, using rule-based enhancer fallback:', e);
      }
    }

    // High-quality fallback rule-based enhancement if API key is not present or offline
    let enhanced = trimmed;
    // Sentence cleanup & capitalization
    enhanced = enhanced.replace(/\b(wanna|gonna|gotta)\b/gi, (match) => {
      if (match.toLowerCase() === 'wanna') return 'intend to';
      if (match.toLowerCase() === 'gonna') return 'will';
      if (match.toLowerCase() === 'gotta') return 'must';
      return match;
    });

    // Normalize spacing and list markers
    enhanced = enhanced
      .split('\n')
      .map(line => {
        let l = line.trim();
        if (l.startsWith('- ') || l.startsWith('* ')) {
          l = '• ' + l.substring(2);
        }
        if (l.length > 0) {
          l = l.charAt(0).toUpperCase() + l.slice(1);
        }
        return l;
      })
      .join('\n');

    // Ensure ending period for paragraphs
    if (!enhanced.endsWith('.') && !enhanced.endsWith(';') && !enhanced.endsWith(':')) {
      enhanced += '.';
    }

    return NextResponse.json({ enhancedText: enhanced });
  } catch (error: any) {
    console.error('Error enhancing text:', error);
    return NextResponse.json({ error: error.message || 'Enhancement failed' }, { status: 500 });
  }
}

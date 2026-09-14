import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, fieldName, currentValue, formContext } = body;

    const inputVal = (currentValue || text || '').trim();
    const ctx = formContext || {};

    const titleStr = ctx.title || 'CAIS Reporting Change';
    const productsStr = Array.isArray(ctx.impactedProducts) ? ctx.impactedProducts.join(', ') : ctx.impactedProducts || 'HSBC Cards (51)';
    const varsStr = Array.isArray(ctx.impactedVariables) ? ctx.impactedVariables.join(', ') : ctx.impactedVariables || '17. Original Default Balance, 42. Default Satisfaction Date';
    const biStr = Array.isArray(ctx.biImpactedChange) ? ctx.biImpactedChange.join(', ') : ctx.biImpactedChange || 'Staging, Exceptions';
    const beforeStr = ctx.beforeText || '';
    const afterStr = ctx.afterText || '';

    // Smart contextual draft generator if field is empty or short
    if (!inputVal || inputVal.length < 5) {
      if (fieldName === 'title') {
        return NextResponse.json({ enhancedText: `${titleStr} — Data Transformation & Validation Update` });
      }
      if (fieldName === 'description') {
        return NextResponse.json({
          enhancedText: `Update CAIS monthly reporting extract logic for ${productsStr} impacting ${varsStr} across ${biStr}. Aligns extraction and staging validation rules in accordance with regulatory reporting specifications.`,
        });
      }
      if (fieldName === 'beforeText') {
        return NextResponse.json({
          enhancedText: beforeStr || `Prior logic extracted ${productsStr} without applying updated validation checks for ${varsStr}.`,
        });
      }
      if (fieldName === 'afterText') {
        return NextResponse.json({
          enhancedText: afterStr || `Corrected logic applies standardized transformation and staging validation for ${varsStr} across ${productsStr} prior to monthly snapshot loading.`,
        });
      }
    }

    // Polishing existing text
    let enhanced = inputVal;

    enhanced = enhanced.replace(/\b(wanna|gonna|gotta)\b/gi, (match: string) => {
      if (match.toLowerCase() === 'wanna') return 'intend to';
      if (match.toLowerCase() === 'gonna') return 'will';
      if (match.toLowerCase() === 'gotta') return 'must';
      return match;
    });

    enhanced = enhanced
      .split('\n')
      .map((line: string) => {
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

    if (!enhanced.endsWith('.') && !enhanced.endsWith(';') && !enhanced.endsWith(':')) {
      enhanced += '.';
    }

    return NextResponse.json({ enhancedText: enhanced });
  } catch (error: any) {
    console.error('Error enhancing text:', error);
    return NextResponse.json({ error: error.message || 'Enhancement failed' }, { status: 500 });
  }
}

import { buildBankabilityContext } from '../utils/buildChatContext'
import { getStoredApiKey, getStoredModel, sendChatCompletion } from './openaiChat'

const BANKER_REVIEW_PROMPT = `You are a senior Italian infrastructure debt banker evaluating senior secured project finance for a PV/Wind/BESS hybrid renewable asset.

Use ONLY the JSON model data provided. Do not invent numbers or claim FER Z is final regulation.

Write your entire response in **English** as clean **Markdown** with this structure:

## Lending Appetite
- **Overall view:** (High / Medium / Low)
- **Estimated credit approval probability:** (%, with brief rationale)
- **Recommended structure:** (Merchant / PPA / FER Z — which is most bankable and why)

## Strengths
- (bullet points, metric-referenced)

## Weaknesses and Risks
- (bullet points, metric-referenced)

## Covenant Assessment
- Min DSCR, Avg DSCR, Min LLCR vs lender thresholds (1.25× DSCR, 1.20× LLCR)
- Debt tenor, LTV, BESS replacement impact

## Structure Comparison
- Merchant vs PPA vs FER Z — brief bankability comparison

## Recommendations for Credit Committee
- Pre-financing improvements / CPs / risk mitigants

Be direct, professional, and specific. Quote key numbers from the data.`

export async function requestBankerReview({
  assumptions,
  model,
  scenarios,
  activeScenarioName,
  assumptionsChanged,
  savedScenarios = [],
}) {
  const context = buildBankabilityContext({
    activeTab: 'dashboard',
    assumptions,
    model,
    scenarios,
    activeScenarioName,
    assumptionsChanged,
    savedScenarios,
  })

  context.dscrProfile = model.rows
    .filter(row => row.dscr != null)
    .map(row => ({ year: row.y, dscr: +row.dscr.toFixed(2), cfads_EUR_M: +row.cfads.toFixed(2) }))

  const markdown = await sendChatCompletion({
    apiKey: getStoredApiKey(),
    model: getStoredModel(),
    systemPrompt: `${BANKER_REVIEW_PROMPT}\n\nModel JSON:\n${JSON.stringify(context, null, 2)}`,
    messages: [{
      role: 'user',
      content:
        'Review this scenario\'s dashboard results from a banker\'s perspective. ' +
        'Write lending probability, strengths/weaknesses, and structure comparison in markdown.',
    }],
  })

  return markdown
}

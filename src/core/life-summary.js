/**
 * Build the owner-facing current-life view from the existing Life, State and
 * Experience authorities. This is a derived view only: it does not write
 * memory, create intents, or schedule work.
 */

const ACTIVE_ACTIVITY_STATES = new Set(['pending', 'running', 'paused', 'stopping', 'unknown'])

function safeList(read, fallback) {
  try { return read() ?? fallback } catch { return fallback }
}

/** @param {Record<string, any>} runtime @returns {Record<string, any>} */
export function buildLifeSummary(runtime) {
  const life = runtime.bridges?.life?.core?.v1
  const intentsResult = life?.adminListIntents ? safeList(() => life.adminListIntents({ limit: 50, offset: 0 }), { total: 0, items: [] }) : { total: 0, items: [] }
  const activitiesResult = life?.adminListActivities ? safeList(() => life.adminListActivities({ limit: 50, offset: 0 }), { total: 0, items: [] }) : { total: 0, items: [] }
  const intents = Array.isArray(intentsResult.items) ? intentsResult.items : []
  const activities = Array.isArray(activitiesResult.items) ? activitiesResult.items : []
  const activeIntents = intents.filter((item) => item?.status === 'active')
  const activeActivities = activities.filter((item) => ACTIVE_ACTIVITY_STATES.has(item?.status))
  const nextIntent = activeIntents.filter((item) => typeof item?.reviewAt === 'string').sort((a, b) => a.reviewAt.localeCompare(b.reviewAt))[0] ?? null
  const recentExperiences = safeList(() => runtime.experiences?.ownerList?.() ?? [], [])
  const stateOverview = safeList(() => runtime.bridges?.state?.service?.workspaceOverview?.() ?? null, null)
  const stateMain = stateOverview?.main ?? null
  const interests = Array.isArray(stateMain?.interests) ? stateMain.interests.slice(0, 8).map((interest) => ({ name: interest.name ?? interest.topic ?? null, score: interest.score ?? interest.strength ?? null, lastSeenAt: interest.lastSeenAt ?? interest.updatedAt ?? null })) : []
  const latestExperience = recentExperiences[0] ?? null
  const focus = activeActivities[0] ?? null
  return {
    generatedAt: new Date().toISOString(), source: 'derived-core-view',
    life: {
      state: safeList(() => runtime.bridges?.life?.api?.getHealth?.()?.state ?? 'unavailable', 'unavailable'),
      activeIntentCount: activeIntents.length, intentCount: Number(intentsResult.total ?? intents.length), nextReviewAt: nextIntent?.reviewAt ?? null,
      nextIntent: nextIntent ? { id: nextIntent.id, revision: nextIntent.revision, reviewAt: nextIntent.reviewAt, description: nextIntent.description } : null,
      activeActivityCount: activeActivities.length,
      focus: focus ? { id: focus.id, status: focus.status, description: focus.description ?? null, ownerScope: focus.ownerScope ?? null } : null,
    },
    state: { interests, current: stateMain?.state ? { mood: stateMain.state.mood, energy: stateMain.state.energy, curiosity: stateMain.state.curiosity } : null },
    recentExperience: latestExperience ? { eventId: latestExperience.eventId, platform: latestExperience.platform, operation: latestExperience.operation, occurredAt: latestExperience.occurredAt, status: latestExperience.status, evidenceLevel: latestExperience.evidenceLevel, summary: latestExperience.observationSummary } : null,
    canRest: activeActivities.length === 0,
    canConsiderContact: activeIntents.length > 0 && activeActivities.length === 0,
  }
}

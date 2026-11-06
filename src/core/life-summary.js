/**
 * Build the owner-facing current-life view from the existing Life, State and
 * Experience authorities. This is a derived view only: it does not write
 * memory, create intents, or schedule work.
 */

const PAGE_SIZE = 200
const MAX_ITEMS = 5_000
const CURRENT_ACTIVITY_STATUSES = new Set(['running'])
const PENDING_ACTIVITY_STATUSES = new Set(['pending'])
const PAUSED_ACTIVITY_STATUSES = new Set(['paused'])
const UNCERTAIN_ACTIVITY_STATUSES = new Set(['stopping', 'unknown'])

function errorCode(error, fallback) {
  const code = typeof error?.code === 'string' && /^[A-Z0-9_:-]{2,80}$/.test(error.code) ? error.code : null
  return code ?? fallback
}

function readPaged(read, label) {
  if (typeof read !== 'function') return { status: 'unavailable', items: [], total: null, complete: false, error: `${label}_unsupported` }
  const items = []
  let total = null
  let offset = 0
  try {
    while (items.length < MAX_ITEMS) {
      const page = read({ limit: PAGE_SIZE, offset })
      if (!page || !Array.isArray(page.items)) throw new Error('invalid_page')
      const pageTotal = Number(page.total)
      if (Number.isSafeInteger(pageTotal) && pageTotal >= 0) total = pageTotal
      items.push(...page.items)
      offset += page.items.length
      if (page.items.length === 0 || (total !== null && items.length >= total)) break
      if (page.items.length < PAGE_SIZE && total === null) break
    }
    const complete = total !== null ? items.length >= total : false
    return {
      status: complete || total === 0 ? 'ok' : 'partial',
      items: items.slice(0, MAX_ITEMS),
      total,
      complete,
      error: complete || total === 0 ? null : `${label}_bounded`,
    }
  } catch (error) {
    return { status: 'unavailable', items: [], total: null, complete: false, error: errorCode(error, `${label}_read_failed`) }
  }
}

function readValue(read, label, fallback = null) {
  if (typeof read !== 'function') return { status: 'unavailable', value: fallback, error: `${label}_unsupported` }
  try {
    return { status: 'ok', value: read() ?? fallback, error: null }
  } catch (error) {
    return { status: 'unavailable', value: fallback, error: errorCode(error, `${label}_read_failed`) }
  }
}

function validReviewAt(value) {
  if (typeof value !== 'string') return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? { value, timestamp } : null
}

/** @param {Record<string, any>} runtime @returns {Record<string, any>} */
export function buildLifeSummary(runtime) {
  const life = runtime.bridges?.life?.core?.v1
  const intents = readPaged(life?.adminListIntents?.bind(life), 'life_intents')
  const activities = readPaged(life?.adminListActivities?.bind(life), 'life_activities')
  const health = readValue(runtime.bridges?.life?.api?.getHealth?.bind(runtime.bridges?.life?.api), 'life_health', {})
  const stateOverview = readValue(runtime.bridges?.state?.service?.workspaceOverview?.bind(runtime.bridges?.state?.service), 'state_overview')
  const experiences = readValue(runtime.experiences?.ownerList?.bind(runtime.experiences), 'experiences', [])
  const errors = [intents, activities, health, stateOverview, experiences].map(item => item.error).filter(Boolean)
  const intentItems = intents.items.filter(item => item?.status === 'active')
  const activityItems = activities.items
  const currentActivities = activityItems.filter(item => CURRENT_ACTIVITY_STATUSES.has(item?.status))
  const pendingActivities = activityItems.filter(item => PENDING_ACTIVITY_STATUSES.has(item?.status))
  const pausedActivities = activityItems.filter(item => PAUSED_ACTIVITY_STATUSES.has(item?.status))
  const uncertainActivities = activityItems.filter(item => UNCERTAIN_ACTIVITY_STATUSES.has(item?.status))
  const reviewCandidates = intentItems
    .map(item => ({ item, review: validReviewAt(item?.reviewAt) }))
    .filter(item => item.review)
    .sort((a, b) => a.review.timestamp - b.review.timestamp)
  const nextReview = reviewCandidates[0] ?? null
  const recentStored = (Array.isArray(experiences.value) ? experiences.value : [])
    .filter(item => item?.status === 'stored' || item?.status === 'completed')
  const latestExperience = recentStored[0] ?? null
  const stateMain = stateOverview.value?.main ?? null
  const interests = Array.isArray(stateMain?.interests)
    ? stateMain.interests.slice(0, 8).map(interest => ({
      name: interest.name ?? interest.topic ?? null,
      score: interest.score ?? interest.strength ?? null,
      lastSeenAt: interest.lastSeenAt ?? interest.updatedAt ?? null,
    }))
    : []
  const canRestNow = currentActivities.length === 0 && pendingActivities.length === 0 && uncertainActivities.length === 0
  const canConsiderContactNow = intentItems.length > 0 && canRestNow && pausedActivities.length === 0
  return {
    generatedAt: new Date().toISOString(),
    source: 'derived-core-owner-view',
    errors,
    sources: {
      intents: { status: intents.status, total: intents.total, complete: intents.complete },
      activities: { status: activities.status, total: activities.total, complete: activities.complete },
      health: { status: health.status },
      state: { status: stateOverview.status },
      experiences: { status: experiences.status },
    },
    life: {
      state: health.value?.state ?? 'unavailable',
      activeIntentCount: intents.status === 'unavailable' ? null : intentItems.length,
      intentCount: intents.total,
      nextReviewAt: nextReview?.review.value ?? null,
      nextReviewSource: nextReview ? 'life.intent.reviewAt' : null,
      nextIntent: nextReview ? {
        id: nextReview.item.id,
        revision: nextReview.item.revision,
        reviewAt: nextReview.item.reviewAt,
        description: nextReview.item.description,
      } : null,
      activityCounts: {
        running: currentActivities.length,
        pending: pendingActivities.length,
        paused: pausedActivities.length,
        uncertain: uncertainActivities.length,
      },
      currentActivity: currentActivities[0] ? {
        id: currentActivities[0].id,
        status: currentActivities[0].status,
        description: currentActivities[0].description ?? null,
        ownerScope: currentActivities[0].ownerScope ?? null,
      } : null,
      canRestNow,
      canConsiderContactNow,
    },
    state: {
      interests,
      current: stateMain?.state ? {
        mood: stateMain.state.mood,
        energy: stateMain.state.energy,
        curiosity: stateMain.state.curiosity,
      } : null,
    },
    recentExperience: latestExperience ? {
      eventId: latestExperience.eventId,
      platform: latestExperience.platform,
      operation: latestExperience.operation,
      occurredAt: latestExperience.occurredAt,
      status: latestExperience.status,
      evidenceLevel: latestExperience.evidenceLevel,
      summary: latestExperience.observationSummary,
    } : null,
    pendingExperienceCount: (Array.isArray(experiences.value) ? experiences.value : []).filter(item => item?.status === 'pending').length,
  }
}

<template>
  <main class="page-shell" :class="{ female: currentSex === 'female' }">
    <section class="hero-panel">
      <div>
        <p class="building-name">{{ buildingName || '智慧楼宇' }}</p>
        <h1>智慧卫生间</h1>
        <p class="sub-title">SMART RESTROOM</p>
      </div>
      <div class="live-chip" :class="{ muted: errorMessage }">
        <span></span>
        {{ errorMessage ? '异常' : '实时' }}
      </div>
    </section>

    <section class="recommend-panel">
      <div>
        <span class="caption">推荐前往</span>
        <div class="recommend-floor">{{ recommendFloor.floor ? `${recommendFloor.floor}F` : '--' }}</div>
      </div>
      <p>{{ recommendText }}</p>
      <strong>最优楼层</strong>
    </section>

    <section class="control-panel">
      <div>
        <span>刷新频率</span>
        <select v-model.number="refreshSeconds" aria-label="刷新频率">
          <option v-for="option in refreshOptions" :key="option" :value="option">
            {{ option }} 秒
          </option>
        </select>
      </div>
      <button
        class="refresh-action"
        :class="{ loading: isRefreshing }"
        :disabled="isRefreshing"
        :style="{ '--refresh-progress': `${refreshProgress}%` }"
        :aria-label="isRefreshing ? '正在刷新' : '立即刷新'"
        title="立即刷新"
        @click="refreshAll"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 11.2A8 8 0 0 0 6.7 5.5L5 7.2" />
          <path d="M5 3.4v3.8h3.8" />
          <path d="M4 12.8a8 8 0 0 0 13.3 5.7l1.7-1.7" />
          <path d="M19 20.6v-3.8h-3.8" />
        </svg>
      </button>
    </section>

    <p v-if="errorMessage" class="error-tip">{{ errorMessage }}</p>

    <nav class="sex-switch" aria-label="厕所类型">
      <button :class="{ active: currentSex === 'male' }" @click="switchSex('male')">男厕所</button>
      <button :class="{ active: currentSex === 'female' }" @click="switchSex('female')">女厕所</button>
    </nav>

    <section class="stat-grid" aria-label="状态统计">
      <article>
        <span class="dot free"></span>
        <strong>{{ totalFree }}</strong>
        <p>空闲</p>
      </article>
      <article>
        <span class="dot occupied"></span>
        <strong>{{ totalUsed }}</strong>
        <p>占用</p>
      </article>
      <article>
        <span class="dot total"></span>
        <strong>{{ totalPits }}</strong>
        <p>总数</p>
      </article>
    </section>

    <section class="section-head">
      <h2>楼层状态</h2>
      <time>{{ lastUpdated || currentTime }} 更新</time>
    </section>

    <section v-if="floors.length" class="floor-list">
      <article
        v-for="floor in floors"
        :key="floor.floor"
        class="floor-card"
        :class="{ expanded: expandedFloor === floor.floor }"
        @click="toggleFloor(floor.floor)"
      >
        <div class="floor-summary">
          <div class="floor-badge">{{ floor.floor }}</div>
          <div>
            <h3>{{ floor.floor }}楼</h3>
            <p>{{ currentSexLabel }} · 空闲 {{ currentFreeCount(floor) }} / {{ currentPits(floor).length }}</p>
          </div>
          <span class="chevron">⌄</span>
        </div>

        <div v-if="currentPits(floor).length" class="pit-row">
          <span
            v-for="(pit, index) in currentPits(floor)"
            :key="`${pit.position || index}-${pit.time}`"
            class="pit-dot"
            :class="pitClass(pit.time)"
            :title="pit.time === -1 ? '空闲' : formatDuration(pit.time)"
          ></span>
        </div>
        <p v-else class="no-pits">暂无坑位明细</p>

        <div v-if="expandedFloor === floor.floor" class="pit-detail" @click.stop>
          <div v-if="currentPits(floor).length">
            <div v-for="(pit, index) in currentPits(floor)" :key="index" class="detail-line">
              <span>{{ pitLabel(floor.floor, index + 1) }}</span>
              <strong :class="pitClass(pit.time)">{{ pit.time === -1 ? '空闲' : '占用中' }}</strong>
              <em v-if="pit.time !== -1">{{ formatDuration(pit.time) }}</em>
            </div>
          </div>
          <p v-else class="no-pits">该楼层暂未返回 {{ currentSexLabel }} 坑位状态。</p>
        </div>
      </article>
    </section>

    <section v-else class="empty-state">
      {{ isRefreshing ? '正在加载楼层数据…' : '暂无楼层数据' }}
    </section>

    <footer class="legend">
      <span><i class="free"></i>空闲</span>
      <span><i class="short"></i>0-8分钟</span>
      <span><i class="medium"></i>8-15分钟</span>
      <span><i class="long"></i>15分钟以上</span>
    </footer>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const DEFAULT_PARTNER_ID = '283443972062314497'
const DEFAULT_REFRESH_SECONDS = 5
const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '/api-proxy' : 'https://sapp.gewuzhixin.com')

const floorToiletIdMap = {
  1: '2tqyclax9wbmx7q4d07fijxgq92vt2xs',
  2: '5udpr6xzl80jgtpyk2vxbpbkyzg8297u',
  3: 'gyxcwj6j8hldrsmb8x9l49ptioin9bsi',
  5: 'lmcblgg3dz04tn7z2v55ov92mfijadh3',
  6: 'jeabjwt9ysv94srd2bj4zyfpkmp5yqgu'
}

const refreshOptions = [3, 5, 10, 30, 60]
const partnerId = ref(getPartnerId())
const appId = ref('')
const buildingName = ref('')
const currentSex = ref('male')
const expandedFloor = ref(null)
const currentTime = ref('')
const lastUpdated = ref('')
const errorMessage = ref('')
const isRefreshing = ref(false)
const refreshSeconds = ref(Number(localStorage.getItem('refreshSeconds')) || DEFAULT_REFRESH_SECONDS)
const floors = ref([])
const refreshCycleStartedAt = ref(Date.now())
const progressNow = ref(Date.now())

let clockTimer = 0
let refreshTimer = 0
let progressTimer = 0
let requestSeq = 0

const currentSexLabel = computed(() => currentSex.value === 'male' ? '男厕' : '女厕')
const currentPits = (floor) => currentSex.value === 'male' ? floor.malePits : floor.femalePits

const totalFree = computed(() => floors.value.reduce((sum, floor) => sum + currentFreeCount(floor), 0))
const totalPits = computed(() => floors.value.reduce((sum, floor) => sum + currentPits(floor).length, 0))
const totalUsed = computed(() => totalPits.value - totalFree.value)

const recommendFloor = computed(() => {
  if (!floors.value.length) return { floor: '', free: 0 }
  return floors.value.reduce((best, floor) => {
    const free = currentFreeCount(floor)
    return free > best.free ? { floor: floor.floor, free } : best
  }, { floor: floors.value[0].floor, free: currentFreeCount(floors.value[0]) })
})

const recommendText = computed(() => {
  if (!recommendFloor.value.floor) return '等待实时数据返回'
  if (recommendFloor.value.free <= 0) return `${currentSexLabel.value}当前暂无空闲坑位`
  return `${currentSexLabel.value}空闲 ${recommendFloor.value.free} 个，建议优先前往`
})

const refreshProgress = computed(() => {
  if (isRefreshing.value) return 100
  const duration = refreshSeconds.value * 1000
  const elapsed = progressNow.value - refreshCycleStartedAt.value
  return Math.max(0, Math.min(100, (elapsed / duration) * 100))
})

watch(refreshSeconds, (value) => {
  localStorage.setItem('refreshSeconds', String(value))
  restartRefreshTimer()
})

function getPartnerId() {
  const url = new URL(window.location.href)
  const queryPid = url.searchParams.get('partnerId') || url.searchParams.get('pid')
  if (queryPid) return queryPid

  const hash = window.location.hash || ''
  if (hash.includes('=')) return hash.slice(hash.indexOf('=') + 1)
  return DEFAULT_PARTNER_ID
}

async function requestApi(path) {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(`接口请求失败：${response.status}`)
  }
  const payload = await response.json()
  if (payload.retCode !== 0) {
    throw new Error(payload.message || `接口返回异常：${payload.retCode}`)
  }
  return payload.data
}

async function fetchBuildInfo() {
  const data = await requestApi(`/api/toiletData/getBuilds?partnerId=${encodeURIComponent(partnerId.value)}`)
  const firstBuild = Array.isArray(data) ? data[0] : null
  if (!firstBuild?.appId) {
    throw new Error('未获取到楼宇 appId')
  }
  appId.value = firstBuild.appId
  buildingName.value = firstBuild.areaName || '智慧楼宇'
}

async function refreshAll() {
  const seq = ++requestSeq
  window.clearTimeout(refreshTimer)
  isRefreshing.value = true
  errorMessage.value = ''

  try {
    if (!appId.value) {
      await fetchBuildInfo()
    }

    const floorSummaries = await requestApi(`/api/toiletData/getSurplusPitsOfAllType?appId=${encodeURIComponent(appId.value)}`)
    const nextFloors = (Array.isArray(floorSummaries) ? floorSummaries : []).map((item) => ({
      floor: Number(item.floor),
      floorName: item.floorName || `${item.floor}楼`,
      maleSurplusPits: Number(item.maleSurplusPits) || 0,
      femaleSurplusPits: Number(item.femaleSurplusPits) || 0,
      malePits: [],
      femalePits: []
    }))

    await Promise.all(nextFloors.map(fetchFloorStatuses))

    if (seq !== requestSeq) return
    floors.value = nextFloors
    if (!expandedFloor.value && nextFloors.length) {
      expandedFloor.value = nextFloors[0].floor
    }
    lastUpdated.value = getTime()
  } catch (error) {
    if (seq === requestSeq) {
      errorMessage.value = error instanceof Error ? error.message : '数据刷新失败'
    }
  } finally {
    if (seq === requestSeq) {
      isRefreshing.value = false
      restartRefreshTimer()
    }
  }
}

async function fetchFloorStatuses(floor) {
  const toiletId = floorToiletIdMap[floor.floor]
  if (!toiletId) return

  const path = [
    '/api/toiletData/getBuildToiletAndFloorStatusOfAllType',
    `?appId=${encodeURIComponent(appId.value)}`,
    `&floor=${encodeURIComponent(floor.floor)}`,
    `&toiletId=${encodeURIComponent(toiletId)}`
  ].join('')

  const data = await requestApi(path)
  const buildToiletData = data?.buildToiletData || {}
  floor.malePits = normalizePits(buildToiletData.malePitStatuses)
  floor.femalePits = normalizePits(buildToiletData.femalePitStatuses)
}

function normalizePits(pits) {
  return Array.isArray(pits) ? pits.map((pit) => ({
    position: pit.position,
    type: pit.type,
    time: Number(pit.time)
  })) : []
}

function currentFreeCount(floor) {
  return currentPits(floor).filter((pit) => pit.time === -1).length
}

function switchSex(sex) {
  currentSex.value = sex
}

function toggleFloor(floor) {
  expandedFloor.value = expandedFloor.value === floor ? null : floor
}

function restartRefreshTimer() {
  window.clearTimeout(refreshTimer)
  refreshCycleStartedAt.value = Date.now()
  progressNow.value = refreshCycleStartedAt.value
  if (!isRefreshing.value) {
    refreshTimer = window.setTimeout(refreshAll, refreshSeconds.value * 1000)
  }
}

function getTime() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function updateTime() {
  currentTime.value = getTime()
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  return `${minutes}m ${rest}s`
}

function pitClass(time) {
  if (time === -1) return 'free'
  if (time <= 480) return 'short'
  if (time <= 900) return 'medium'
  return 'long'
}

function pitLabel(floor, index) {
  return `${currentSex.value === 'male' ? 'M' : 'F'}${floor}-${index}`
}

onMounted(() => {
  updateTime()
  clockTimer = window.setInterval(updateTime, 1000)
  progressTimer = window.setInterval(() => {
    progressNow.value = Date.now()
  }, 120)
  restartRefreshTimer()
  refreshAll()
})

onUnmounted(() => {
  window.clearInterval(clockTimer)
  window.clearTimeout(refreshTimer)
  window.clearInterval(progressTimer)
})
</script>

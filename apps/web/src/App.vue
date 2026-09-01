<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import AdminPanel from './components/AdminPanel.vue';
import FloatingStickers from './components/FloatingStickers.vue';
import { useInvitationStore } from './stores/invitation';

type PublicTab = 'invite' | 'progress' | 'security';
type Theme = 'ocean' | 'warm';

const store = useInvitationStore();
const showAdmin = ref(false);
const activeTab = ref<PublicTab>('invite');
const theme = ref<Theme>('ocean');

const statusCopy = computed(() => {
  const copy = {
    QUEUED: { label: '排队中', title: '任务已进入队列', description: '正在确认已预占席位，请稍候。', tone: 'queued' },
    PROCESSING: { label: '处理中', title: '正在发送邀请', description: '已选择符合条件的母号，正在执行邀请。', tone: 'processing' },
    SUCCEEDED: { label: '已完成', title: '邀请处理完成', description: '请前往邮箱查看邀请，并按邮件提示加入家庭组。', tone: 'succeeded' },
    FAILED: { label: '未完成', title: '邀请处理失败', description: store.task?.failureReason || '席位已释放，请联系管理员处理。', tone: 'failed' },
  };
  return copy[store.task?.status ?? 'QUEUED'];
});

const progressItems = computed(() => {
  const status = store.task?.status;
  return [
    { label: '卡密验证', state: 'done' },
    { label: '席位预占', state: status === 'QUEUED' ? 'active' : 'done' },
    {
      label: '邀请执行',
      state: status === 'PROCESSING' ? 'active' : status === 'SUCCEEDED' ? 'done' : status === 'FAILED' ? 'error' : 'pending',
    },
    { label: '处理完成', state: status === 'SUCCEEDED' ? 'done' : 'pending' },
  ];
});

function setTab(tab: PublicTab): void {
  activeTab.value = tab;
}

function toggleTheme(): void {
  theme.value = theme.value === 'ocean' ? 'warm' : 'ocean';
  localStorage.setItem('family-flow-theme', theme.value);
}

watch(
  () => store.task?.id,
  (id) => {
    if (id) activeTab.value = 'progress';
  },
);

onMounted(() => {
  const savedTheme = localStorage.getItem('family-flow-theme');
  if (savedTheme === 'warm' || savedTheme === 'ocean') theme.value = savedTheme;
  void store.restore();
});
</script>

<template>
  <div :class="['page', `theme-${theme}`]">
    <FloatingStickers />

    <div class="page-wrap">
      <header class="site-header">
        <a class="brand" href="#" aria-label="FamilyFlow 首页" @click.prevent="setTab('invite')">
          <span class="brand-mark">F</span>
          <span><strong>FamilyFlow</strong><small>第三方自助服务</small></span>
        </a>
        <div class="header-actions">
          <button class="utility-button" data-theme-toggle @click="toggleTheme">
            {{ theme === 'ocean' ? '暖色主题' : '冷色主题' }}
          </button>
          <button class="utility-button admin-entry" @click="showAdmin = true">管理入口</button>
        </div>
      </header>

      <main>
        <section class="hero-header">
          <span class="hero-kicker">✦ SELF-SERVICE INVITATION</span>
          <h1>Gemini 家庭组 <span>邀请中心</span></h1>
          <p>验证卡密并提交接收邮箱，系统自动分配可用席位，处理状态全程可查。</p>
          <div class="feature-badges" aria-label="平台能力">
            <span class="feature-badge mint">✓ 卡密安全验证</span>
            <span class="feature-badge pink">✉ 异步邀请处理</span>
          </div>
        </section>

        <section class="workspace">
          <nav class="top-tabs" aria-label="自助服务导航">
            <button :class="['top-tab', { active: activeTab === 'invite' }]" data-tab="invite" @click="setTab('invite')">
              <span aria-hidden="true">✦</span> 兑换邀请
            </button>
            <button :class="['top-tab', { active: activeTab === 'progress' }]" data-tab="progress" @click="setTab('progress')">
              <span aria-hidden="true">◷</span> 任务进度
            </button>
            <button :class="['top-tab', { active: activeTab === 'security' }]" data-tab="security" @click="setTab('security')">
              <span aria-hidden="true">◇</span> 安全说明
            </button>
          </nav>

          <Transition name="panel-pop" mode="out-in">
            <section v-if="activeTab === 'invite'" key="invite" class="cartoon-panel invite-panel">
              <div class="panel-heading">
                <div>
                  <span class="section-label">INVITE</span>
                  <h2>发起家庭组邀请</h2>
                  <p>按步骤完成卡密验证与邮箱提交。</p>
                </div>
                <div class="panel-pills" aria-label="流程特点">
                  <span>自动分配母号</span>
                  <span>邮件邀请到账</span>
                </div>
              </div>

              <div class="info-strip">
                <span class="info-icon">i</span>
                <p>只填写用于接收邀请的邮箱，<strong>不需要 Google 密码、Cookie 或 2FA。</strong></p>
              </div>

              <nav class="flow-steps" aria-label="邀请步骤">
                <div v-for="item in 3" :key="item" :class="['flow-step', { active: store.step >= item, done: store.step > item }]">
                  <span>{{ store.step > item ? '✓' : item }}</span>
                  <small>{{ ['验证卡密', '填写邮箱', '查看进度'][item - 1] }}</small>
                </div>
              </nav>

              <Transition name="stage-swap" mode="out-in">
                <div v-if="store.step === 1" key="card" class="stage">
                  <div class="stage-title"><span>01</span><div><h3>验证你的卡密</h3><p>输入订单对应的卡密，验证通过后再填写邮箱。</p></div></div>
                  <form @submit.prevent="store.verify">
                    <label for="code">CDK 卡密 <b>*</b></label>
                    <div class="field-wrap">
                      <span class="field-icon" aria-hidden="true">⌁</span>
                      <input id="code" v-model.trim="store.code" required minlength="8" maxlength="64" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" />
                    </div>
                    <button class="primary-button" :disabled="store.busy || store.code.length < 8">
                      {{ store.busy ? '正在验证…' : '验证卡密并继续' }}
                    </button>
                  </form>
                </div>

                <div v-else-if="store.step === 2" key="email" class="stage">
                  <div class="stage-title"><span>02</span><div><h3>填写邀请邮箱</h3><p>请填写用于接收家庭组邀请的 Google 邮箱。</p></div></div>
                  <form @submit.prevent="store.submit">
                    <label for="email">Google 邮箱 <b>*</b></label>
                    <div class="field-wrap">
                      <span class="field-icon" aria-hidden="true">@</span>
                      <input id="email" v-model.trim="store.email" required type="email" maxlength="254" placeholder="name@gmail.com" autocomplete="email" />
                    </div>
                    <button class="primary-button" :disabled="store.busy || !store.email">
                      {{ store.busy ? '正在提交…' : '提交邀请任务' }}
                    </button>
                  </form>
                  <button class="text-button" @click="store.cardVerified = false">← 返回并更换卡密</button>
                </div>

                <div v-else key="submitted" class="stage submitted-stage">
                  <span class="submitted-icon">✓</span>
                  <h3>邀请任务已经提交</h3>
                  <p>任务会在后台继续执行，你可以随时查看最新状态。</p>
                  <button class="primary-button" @click="setTab('progress')">查看任务进度</button>
                </div>
              </Transition>

              <p v-if="store.error" class="alert" role="alert"><strong>!</strong>{{ store.error }}</p>
            </section>

            <section v-else-if="activeTab === 'progress'" key="progress" class="cartoon-panel progress-panel">
              <div class="panel-heading compact">
                <div><span class="section-label">TRACKING</span><h2>邀请任务进度</h2><p>页面会自动恢复最近一次提交的任务。</p></div>
              </div>

              <div v-if="store.task" class="task-view">
                <div :class="['journey', statusCopy.tone]" aria-hidden="true">
                  <span class="journey-line" />
                  <span class="journey-start">◆</span>
                  <span class="journey-mail">✉</span>
                  <span class="journey-finish">★</span>
                </div>

                <span :class="['status-badge', statusCopy.tone]">{{ statusCopy.label }}</span>
                <h3>{{ statusCopy.title }}</h3>
                <p class="status-description">{{ statusCopy.description }}</p>

                <ol class="progress-list">
                  <li v-for="(item, index) in progressItems" :key="item.label" :class="item.state">
                    <span>{{ item.state === 'done' ? '✓' : item.state === 'error' ? '!' : index + 1 }}</span>
                    <small>{{ item.label }}</small>
                  </li>
                </ol>

                <dl class="task-details">
                  <div><dt>接收邮箱</dt><dd>{{ store.task.email }}</dd></div>
                  <div><dt>任务编号</dt><dd>{{ store.task.id.slice(0, 8) }}…</dd></div>
                </dl>

                <div class="task-actions">
                  <button v-if="store.terminal" class="secondary-button" @click="store.reset(); setTab('invite')">发起新的邀请</button>
                  <button v-else class="secondary-button" :disabled="store.busy" @click="store.refresh">立即刷新状态</button>
                </div>
                <p v-if="store.error" class="alert" role="alert"><strong>!</strong>{{ store.error }}</p>
              </div>

              <div v-else class="empty-state">
                <span class="empty-icon">✉</span>
                <h3>还没有可查询的任务</h3>
                <p>完成卡密验证并提交邮箱后，任务状态会显示在这里。</p>
                <button class="primary-button" @click="setTab('invite')">开始兑换邀请</button>
              </div>
            </section>

            <section v-else key="security" class="cartoon-panel security-panel">
              <div class="panel-heading compact">
                <div><span class="section-label">PRIVACY</span><h2>只提交必要信息</h2><p>自助邀请只需要卡密和接收邮箱。</p></div>
              </div>
              <div class="security-grid">
                <article><span>01</span><h3>卡密安全存储</h3><p>服务端只保存卡密哈希，不保存可直接使用的明文。</p></article>
                <article><span>02</span><h3>邮箱脱敏展示</h3><p>任务查询和日志中的邮箱均使用脱敏格式。</p></article>
                <article><span>03</span><h3>拒绝敏感凭证</h3><p>平台不会要求提供 Google 密码、Cookie、Token 或 2FA。</p></article>
              </div>
              <button class="primary-button" @click="setTab('invite')">返回兑换邀请</button>
            </section>
          </Transition>
        </section>
      </main>

      <footer>
        <span>FamilyFlow 为第三方自助服务，与 Google 无隶属或官方合作关系。</span>
        <span>当前演示使用 Mock Invitation Provider。</span>
      </footer>
    </div>

    <AdminPanel v-if="showAdmin" @close="showAdmin = false" />
  </div>
</template>

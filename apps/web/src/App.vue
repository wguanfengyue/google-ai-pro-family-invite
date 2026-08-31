<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AdminPanel from './components/AdminPanel.vue';
import { useInvitationStore } from './stores/invitation';

const store = useInvitationStore();
const showAdmin = ref(false);
const statusCopy = computed(() => {
  const copy = {
    QUEUED: ['任务已进入队列', '系统正在分配可用席位，请稍候。'],
    PROCESSING: ['正在发送邀请', '已选择符合条件的母号，正在执行邀请。'],
    SUCCEEDED: ['邀请处理完成', '请前往邮箱查看邀请，并按邮件提示加入家庭组。'],
    FAILED: ['邀请处理失败', store.task?.failureReason || '席位已释放，请联系管理员处理。'],
  };
  return copy[store.task?.status ?? 'QUEUED'];
});

onMounted(() => void store.restore());
</script>

<template>
  <div class="page">
    <header class="topbar">
      <a class="brand" href="#" aria-label="FamilyFlow 首页">
        <span class="brand-mark">F</span>
        <span><strong>FamilyFlow</strong><small>权益自助邀请</small></span>
      </a>
      <div class="header-actions">
        <span class="online"><i />系统在线</span>
        <button class="ghost" @click="showAdmin = true">管理席位</button>
      </div>
    </header>

    <main class="layout">
      <section class="intro">
        <span class="eyebrow">SELF-SERVICE INVITATION</span>
        <h1>三步完成<br /><em>家庭权益邀请</em></h1>
        <p>验证卡密、填写接收邮箱，系统会自动选择有余量的母号并异步处理任务。</p>
        <div class="trust-list">
          <span>✓ 卡密哈希存储</span><span>✓ 邮箱脱敏展示</span><span>✓ 不收集 Google 密码与 2FA</span>
        </div>
      </section>

      <section class="flow-card">
        <nav class="steps" aria-label="处理步骤">
          <div v-for="item in 3" :key="item" :class="['step', { active: store.step >= item }]">
            <span>{{ store.step > item ? '✓' : item }}</span>
            <small>{{ ['验证卡密', '填写邮箱', '执行进度'][item - 1] }}</small>
          </div>
        </nav>

        <div v-if="store.step === 1" class="stage">
          <span class="stage-number">01</span><h2>验证你的卡密</h2>
          <p>输入订单对应的卡密，验证通过后即可提交邀请邮箱。</p>
          <form @submit.prevent="store.verify">
            <label for="code">CDK 卡密</label>
            <input id="code" v-model.trim="store.code" required minlength="8" maxlength="64" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" />
            <button class="primary" :disabled="store.busy || store.code.length < 8">{{ store.busy ? '验证中…' : '验证卡密' }}</button>
          </form>
        </div>

        <div v-else-if="store.step === 2" class="stage">
          <span class="stage-number">02</span><h2>填写邀请邮箱</h2>
          <p>只需提供用于接收家庭组邀请的 Google 邮箱。</p>
          <form @submit.prevent="store.submit">
            <label for="email">Google 邮箱</label>
            <input id="email" v-model.trim="store.email" required type="email" maxlength="254" placeholder="name@gmail.com" autocomplete="email" />
            <button class="primary" :disabled="store.busy || !store.email">{{ store.busy ? '提交中…' : '提交邀请任务' }}</button>
          </form>
          <button class="text-button" @click="store.cardVerified = false">← 更换卡密</button>
        </div>

        <div v-else class="stage status-stage">
          <div :class="['status-orbit', store.task?.status.toLowerCase()]">
            <span>{{ store.task?.status === 'SUCCEEDED' ? '✓' : store.task?.status === 'FAILED' ? '!' : '↻' }}</span>
          </div>
          <span class="status-pill">{{ store.task?.status }}</span>
          <h2>{{ statusCopy[0] }}</h2><p>{{ statusCopy[1] }}</p>
          <dl>
            <div><dt>接收邮箱</dt><dd>{{ store.task?.email }}</dd></div>
            <div><dt>任务编号</dt><dd>{{ store.task?.id.slice(0, 8) }}…</dd></div>
          </dl>
          <button v-if="store.terminal" class="ghost full" @click="store.reset">处理新的邀请</button>
          <button v-else class="ghost full" @click="store.refresh">刷新状态</button>
        </div>
        <p v-if="store.error" class="alert" role="alert">{{ store.error }}</p>
      </section>
    </main>

    <footer>演示环境默认使用 Mock Invitation Provider，不会登录或控制任何 Google 账号。</footer>
    <AdminPanel v-if="showAdmin" @close="showAdmin = false" />
  </div>
</template>

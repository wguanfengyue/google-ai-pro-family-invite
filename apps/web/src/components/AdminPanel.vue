<script setup lang="ts">
import { computed, ref } from 'vue';
import { api, type OwnerAccount } from '../api';

const emit = defineEmits<{ close: [] }>();
const adminKey = ref('');
const label = ref('');
const capacityTotal = ref(5);
const owners = ref<OwnerAccount[]>([]);
const error = ref('');
const busy = ref(false);
const totalAvailable = computed(() => owners.value.reduce((sum, owner) => sum + owner.availableSlots, 0));

async function load(): Promise<void> {
  error.value = ''; busy.value = true;
  try { owners.value = await api.listOwners(adminKey.value); }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '加载失败'; }
  finally { busy.value = false; }
}

async function createOwner(): Promise<void> {
  error.value = ''; busy.value = true;
  try { await api.createOwner(adminKey.value, label.value, capacityTotal.value); label.value = ''; await load(); }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '创建失败'; busy.value = false; }
}

async function toggle(owner: OwnerAccount): Promise<void> {
  try {
    await api.updateOwner(adminKey.value, owner.id, { status: owner.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' });
    await load();
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '更新失败'; }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <section class="admin-panel" aria-label="母号容量管理">
      <div class="panel-title">
        <div><span class="eyebrow">ADMIN CONSOLE</span><h2>母号容量管理</h2></div>
        <button class="icon-button" aria-label="关闭" @click="emit('close')">×</button>
      </div>
      <p class="security-note">这里只保存匿名标签与席位数，不录入 Google 密码、Cookie 或 2FA。</p>
      <div class="admin-auth">
        <input v-model="adminKey" type="password" autocomplete="off" placeholder="管理员 API Key" />
        <button :disabled="busy || !adminKey" @click="load">连接</button>
      </div>
      <p v-if="error" class="alert">{{ error }}</p>
      <template v-if="owners.length">
        <div class="capacity-summary"><span>可用席位</span><strong>{{ totalAvailable }}</strong></div>
        <div class="owner-list">
          <article v-for="owner in owners" :key="owner.id" class="owner-row">
            <div><strong>{{ owner.label }}</strong><small>{{ owner.capacityUsed }} 已用 · {{ owner.pendingSlots }} 处理中 · {{ owner.availableSlots }} 可用</small></div>
            <button class="ghost small" @click="toggle(owner)">{{ owner.status === 'ACTIVE' ? '暂停' : '启用' }}</button>
          </article>
        </div>
      </template>
      <form class="owner-create" @submit.prevent="createOwner">
        <h3>新增母号标签</h3>
        <input v-model="label" required minlength="2" maxlength="80" placeholder="例如 owner-cn-01" />
        <input v-model.number="capacityTotal" required type="number" min="1" max="20" />
        <button :disabled="busy || !adminKey">添加</button>
      </form>
    </section>
  </div>
</template>

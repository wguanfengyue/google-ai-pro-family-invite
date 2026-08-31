import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api, type InvitationTask } from '../api';

const TASK_STORAGE_KEY = 'family-flow-task-id';

export const useInvitationStore = defineStore('invitation', () => {
  const code = ref('');
  const email = ref('');
  const cardVerified = ref(false);
  const task = ref<InvitationTask | null>(null);
  const busy = ref(false);
  const error = ref('');
  let pollTimer: ReturnType<typeof setTimeout> | undefined;

  const step = computed(() => (task.value ? 3 : cardVerified.value ? 2 : 1));
  const terminal = computed(
    () => task.value?.status === 'SUCCEEDED' || task.value?.status === 'FAILED',
  );

  async function verify(): Promise<void> {
    error.value = '';
    busy.value = true;
    try {
      const result = await api.verifyCard(code.value);
      cardVerified.value = result.valid;
      if (!result.valid) {
        const labels: Record<string, string> = {
          REDEEMED: '卡密已被使用', DISABLED: '卡密已停用', EXPIRED: '卡密已过期', NOT_FOUND: '卡密不存在',
        };
        error.value = labels[result.status] ?? '卡密不可用';
      }
    } catch (cause) {
      error.value = toMessage(cause);
    } finally {
      busy.value = false;
    }
  }

  async function submit(): Promise<void> {
    error.value = '';
    busy.value = true;
    try {
      task.value = await api.createInvitation(code.value, email.value);
      localStorage.setItem(TASK_STORAGE_KEY, task.value.id);
      schedulePoll();
    } catch (cause) {
      error.value = toMessage(cause);
    } finally {
      busy.value = false;
    }
  }

  async function refresh(): Promise<void> {
    if (!task.value) return;
    try {
      task.value = await api.getInvitation(task.value.id);
      if (!terminal.value) schedulePoll();
    } catch (cause) {
      error.value = toMessage(cause);
    }
  }

  async function restore(): Promise<void> {
    const id = localStorage.getItem(TASK_STORAGE_KEY);
    if (!id) return;
    try {
      task.value = await api.getInvitation(id);
      if (!terminal.value) schedulePoll();
    } catch {
      localStorage.removeItem(TASK_STORAGE_KEY);
    }
  }

  function reset(): void {
    if (pollTimer) clearTimeout(pollTimer);
    code.value = '';
    email.value = '';
    cardVerified.value = false;
    task.value = null;
    error.value = '';
    localStorage.removeItem(TASK_STORAGE_KEY);
  }

  function schedulePoll(): void {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = setTimeout(() => void refresh(), 1500);
  }

  return { code, email, cardVerified, task, busy, error, step, terminal, verify, submit, refresh, restore, reset };
});

function toMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : '系统繁忙，请稍后重试';
}

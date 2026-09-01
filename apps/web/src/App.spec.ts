import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App.vue';

describe('App', () => {
  beforeEach(() => localStorage.clear());

  it('renders the redesigned invitation experience', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } });
    expect(wrapper.text()).toContain('FamilyFlow');
    expect(wrapper.text()).toContain('Gemini 家庭组');
    expect(wrapper.text()).toContain('验证你的卡密');
    expect(wrapper.findAll('.top-tab')).toHaveLength(3);
  });

  it('switches to the security explanation', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } });
    await wrapper.get('[data-tab="security"]').trigger('click');
    expect(wrapper.text()).toContain('只提交必要信息');
    expect(wrapper.text()).toContain('拒绝敏感凭证');
  });

  it('persists the selected color theme', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } });
    await wrapper.get('[data-theme-toggle]').trigger('click');
    expect(wrapper.classes()).toContain('theme-warm');
    expect(localStorage.getItem('family-flow-theme')).toBe('warm');
  });
});

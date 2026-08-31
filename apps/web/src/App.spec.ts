import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import App from './App.vue';

describe('App', () => {
  it('renders the product name', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } });
    expect(wrapper.text()).toContain('FamilyFlow');
    expect(wrapper.text()).toContain('验证你的卡密');
  });
});

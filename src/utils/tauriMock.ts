/**
 * Tauri API Mock for Pure Frontend Development
 * 在纯前端模式下模拟 Tauri API，让应用可以正常运行
 */

import type { InvokeArgs } from '@tauri-apps/api/core';

// 检测是否在 Tauri 环境中
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// 安全的 invoke 函数 - 自动回退
export const safeInvoke = async (cmd: string, args?: InvokeArgs): Promise<unknown> => {
  if (isTauriEnvironment()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke(cmd, args);
  }

  // 纯前端模式 - 返回模拟数据
  console.log(`[Mock] invoke('${cmd}', ${JSON.stringify(args)})`);

  // 根据不同的命令返回不同的模拟数据
  switch (cmd) {
    case 'frontend_ready':
      return true;

    case 'load_project_state':
      return {
        currentProjectId: null,
        projects: [],
      };

    case 'create_project':
      return { id: `mock-project-${Date.now()}`, ...(args || {}) };

    case 'upsert_project_record':
      return true;

    case 'delete_project_record':
      return true;

    default:
      console.warn(`[Mock] Unknown command: ${cmd}`);
      return null;
  }
};

// 获取项目存储的初始状态
export const getMockProjectInitialState = () => {
  return {
    isHydrated: true,
    currentProjectId: null,
    projects: [],
  };
};

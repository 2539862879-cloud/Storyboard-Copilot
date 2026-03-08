import { message } from '@tauri-apps/plugin-dialog';

export async function showErrorDialog(text: string, title: string): Promise<void> {
  const content = text.trim();
  if (!content) {
    return;
  }

  try {
    await message(content, {
      title,
      kind: 'error',
    });
  } catch {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${content}`);
    }
  }
}


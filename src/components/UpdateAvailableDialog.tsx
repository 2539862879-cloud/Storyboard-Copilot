import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { openUrl } from '@tauri-apps/plugin-opener';
import { UiButton, UiModal } from '@/components/ui';

const QUARK_DOWNLOAD_URL = 'https://pan.quark.cn/s/5b6733a8fc8e';
const GITHUB_RELEASES_URL = 'https://github.com/henjicc/Storyboard-Copilot/releases';

interface UpdateAvailableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  latestVersion?: string;
  currentVersion?: string;
}

export function UpdateAvailableDialog({
  isOpen,
  onClose,
  latestVersion,
  currentVersion,
}: UpdateAvailableDialogProps) {
  const { t } = useTranslation();

  const handleOpenQuark = useCallback(() => {
    void openUrl(QUARK_DOWNLOAD_URL);
  }, []);

  const handleOpenGithub = useCallback(() => {
    void openUrl(GITHUB_RELEASES_URL);
  }, []);

  return (
    <UiModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('update.dialogTitle')}
      footer={(
        <>
          <UiButton variant="muted" onClick={onClose}>
            {t('common.cancel')}
          </UiButton>
          <UiButton variant="muted" onClick={handleOpenQuark}>
            {t('update.goToQuarkDownload')}
          </UiButton>
          <UiButton variant="primary" onClick={handleOpenGithub}>
            {t('update.goToGithubDownload')}
          </UiButton>
        </>
      )}
    >
      <div className="text-sm text-text-muted leading-6">
        <p>{t('update.dialogDescription')}</p>
        {(latestVersion || currentVersion) && (
          <p className="mt-2 text-xs">
            {t('update.versionLine', {
              currentVersion: currentVersion ?? '-',
              latestVersion: latestVersion ?? '-',
            })}
          </p>
        )}
      </div>
    </UiModal>
  );
}

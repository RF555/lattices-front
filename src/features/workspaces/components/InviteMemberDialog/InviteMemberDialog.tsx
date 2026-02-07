import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Link } from 'lucide-react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useCreateInvitation } from '../../hooks/useInvitations';
import type { WorkspaceRole } from '../../types/workspace';

const ROLE_OPTIONS: WorkspaceRole[] = ['viewer', 'member', 'admin'];

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function InviteMemberDialog({ isOpen, onClose, workspaceId }: InviteMemberDialogProps) {
  const { t } = useTranslation('workspaces');
  const createInvitation = useCreateInvitation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('member');
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('validation.emailInvalid', { ns: 'auth', defaultValue: 'Invalid email address' }));
      return;
    }

    try {
      const result = await createInvitation.mutateAsync({ workspaceId, email: email.trim(), role });
      const link = `${window.location.origin}/invite?token=${result.token}`;
      setInviteLink(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Fallback: select the text in the input
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('member');
    setError(null);
    setInviteLink(null);
    setCopied(false);
    onClose();
  };

  if (inviteLink) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('invitation.linkReady', { defaultValue: 'Invitation Created' })}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('invitation.linkDescription', {
              email,
              defaultValue: `An invitation has been sent to ${email}. Share this link for quick access:`,
            })}
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
                <Link className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="truncate text-gray-700">{inviteLink}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                void handleCopyLink();
              }}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t('invitation.copied', { defaultValue: 'Copied' })}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  {t('invitation.copyLink', { defaultValue: 'Copy' })}
                </>
              )}
            </Button>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" onClick={handleClose}>
              {t('form.done', { defaultValue: 'Done' })}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('members.invite')}>
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
            {t('invitation.email')}
          </label>
          {}
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            placeholder={t('invitation.emailPlaceholder')}
            error={!!error}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- dialog auto-focus is expected UX
            autoFocus
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div>
          <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
            {t('invitation.role')}
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as WorkspaceRole);
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t('form.cancel')}
          </Button>
          <Button type="submit">{t('invitation.send')}</Button>
        </div>
      </form>
    </Modal>
  );
}

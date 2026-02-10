import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { LatticesLogo } from '@components/brand';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { useIsAuthenticated } from '@features/auth/stores/authStore';
import { useAcceptInvitation } from '../../hooks/useInvitations';
import { useWorkspaceUiStore } from '../../stores/workspaceUiStore';

type AcceptState = 'loading' | 'success' | 'error';

export function AcceptInvitation() {
  const { t } = useTranslation('workspaces');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const acceptInvitation = useAcceptInvitation();
  const setActiveWorkspace = useWorkspaceUiStore((s) => s.setActiveWorkspace);
  const [state, setState] = useState<AcceptState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate(`/auth/login?redirect=/invite?token=${token}`, { replace: true });
      return;
    }

    if (!token) {
      setState('error');
      setErrorMessage(t('invitation.invalid'));
      return;
    }

    acceptInvitation.mutate(token, {
      onSuccess: (result) => {
        setState('success');
        setWorkspaceId(result.workspaceId);
        setWorkspaceName(result.workspaceName);
      },
      onError: (err) => {
        setState('error');
        if (err.message.includes('expired')) {
          setErrorMessage(t('invitation.expired'));
        } else {
          setErrorMessage(t('invitation.invalid'));
        }
      },
    });
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoToWorkspace = () => {
    if (workspaceId) {
      setActiveWorkspace(workspaceId);
    }
    void navigate('/app', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <LatticesLogo size="md" className="mx-auto mb-4" />

        {state === 'loading' && (
          <>
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">{t('invitation.accepting')}</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('invitation.accepted', { workspace: workspaceName })}
            </h2>
            <Button onClick={handleGoToWorkspace} className="mt-4">
              {t('invitation.goToWorkspace')}
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <Button
              variant="secondary"
              onClick={() => {
                void navigate('/app', { replace: true });
              }}
            >
              {t('invitation.goToWorkspace')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, Grid3X3 } from 'lucide-react';
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

  const token = searchParams.get('token');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=/invite?token=${token}`, { replace: true });
      return;
    }

    if (!token) {
      setState('error');
      setErrorMessage(t('invitation.invalid'));
      return;
    }

    acceptInvitation.mutate(token, {
      onSuccess: (member) => {
        setState('success');
        // The member response should include workspace context
        // For now we navigate to the app and let it pick up the new workspace
        if (member) {
          setWorkspaceId(member.userId); // placeholder - workspace ID will come from the response
        }
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
    navigate('/app', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <Grid3X3 className="h-8 w-8 text-primary mx-auto mb-4" />

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
              {t('invitation.accepted', { workspace: '' })}
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
            <Button variant="secondary" onClick={() => navigate('/app', { replace: true })}>
              {t('invitation.goToWorkspace')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

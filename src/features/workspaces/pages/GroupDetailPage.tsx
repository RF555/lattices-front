import { useParams } from 'react-router';
import { GroupDetail } from '../components/GroupDetail/GroupDetail';

export default function GroupDetailPage() {
  const { id, groupId } = useParams<{ id: string; groupId: string }>();

  if (!id || !groupId) return null;

  return <GroupDetail workspaceId={id} groupId={groupId} />;
}

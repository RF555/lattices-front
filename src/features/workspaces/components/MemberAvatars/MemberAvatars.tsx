import { cn } from '@lib/utils/cn';
import type { WorkspaceMember } from '../../types/workspace';

interface MemberAvatarsProps {
  members: WorkspaceMember[];
  max?: number;
  size?: 'sm' | 'md';
}

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
};

export function MemberAvatars({ members, max = 4, size = 'sm' }: MemberAvatarsProps) {
  const visible = members.slice(0, max);
  const remaining = members.length - max;

  const getInitials = (member: WorkspaceMember) => {
    const name = member.displayName ?? member.email;
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((member) => (
        <div key={member.userId} className="relative" title={member.displayName ?? member.email}>
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt=""
              className={cn('rounded-full ring-2 ring-white object-cover', SIZES[size])}
            />
          ) : (
            <div
              className={cn(
                'rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center font-medium text-gray-600',
                SIZES[size],
              )}
            >
              {getInitials(member)}
            </div>
          )}
        </div>
      ))}

      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center font-medium text-gray-500',
            SIZES[size],
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

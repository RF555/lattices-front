export interface ActivityEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorAvatarUrl: string | null;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  createdAt: string;
}

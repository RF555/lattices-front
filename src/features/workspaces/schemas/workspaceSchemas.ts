import { z } from 'zod';
import type { TFunction } from 'i18next';

export function createWorkspaceSchema(t: TFunction<'workspaces'>) {
  return z.object({
    name: z
      .string()
      .min(1, t('validation.nameRequired'))
      .max(50, t('validation.nameMaxLength')),
    description: z.string().max(200, t('validation.descriptionMaxLength')).optional(),
  });
}

export type WorkspaceFormData = z.infer<ReturnType<typeof createWorkspaceSchema>>;

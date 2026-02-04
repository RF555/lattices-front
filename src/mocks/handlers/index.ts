import { authHandlers } from './authHandlers';
import { todoHandlers } from './todoHandlers';
import { tagHandlers } from './tagHandlers';
import { workspaceHandlers } from './workspaceHandlers';

export const handlers = [
  ...authHandlers,
  ...todoHandlers,
  ...tagHandlers,
  ...workspaceHandlers,
];

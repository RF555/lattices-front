import { authHandlers } from './authHandlers';
import { todoHandlers } from './todoHandlers';
import { tagHandlers } from './tagHandlers';
import { workspaceHandlers } from './workspaceHandlers';
import { notificationHandlers } from './notificationHandlers';

export const handlers = [
  ...authHandlers,
  ...todoHandlers,
  ...tagHandlers,
  ...workspaceHandlers,
  ...notificationHandlers,
];

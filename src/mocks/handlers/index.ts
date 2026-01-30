import { authHandlers } from './authHandlers';
import { todoHandlers } from './todoHandlers';
import { tagHandlers } from './tagHandlers';

export const handlers = [
  ...authHandlers,
  ...todoHandlers,
  ...tagHandlers,
];

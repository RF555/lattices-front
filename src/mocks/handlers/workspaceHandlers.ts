import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

// Helper functions for timestamps
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

// Mock data structures (using snake_case for API responses)
interface MockWorkspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_by: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

interface MockMember {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
}

interface MockInvitation {
  id: string;
  workspace_id: string;
  workspace_name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invited_by_name: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  created_at: string;
  expires_at: string;
}

interface MockActivityEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_avatar_url: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_title: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;
}

interface MockGroup {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  member_count: number;
  created_at: string;
}

interface MockGroupMember {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
  joined_at: string;
}

interface MockNotification {
  id: string;
  type: string;
  actor_name: string;
  actor_avatar_url: string | null;
  entity_type: string;
  entity_id: string;
  message: string;
  is_read: boolean;
  is_seen: boolean;
  created_at: string;
}

interface MockNotificationPreferences {
  [notificationType: string]: {
    in_app: boolean;
    email: boolean;
  };
}

// Mock data
let mockWorkspaces: MockWorkspace[] = [
  {
    id: 'ws-1',
    name: 'Personal Workspace',
    slug: 'personal-workspace',
    description: 'My personal workspace for tasks and projects',
    created_by: 'user-1',
    member_count: 1,
    created_at: daysAgo(30),
    updated_at: daysAgo(5),
  },
  {
    id: 'ws-2',
    name: 'Team Alpha',
    slug: 'team-alpha',
    description: 'Collaborative workspace for Team Alpha',
    created_by: 'user-1',
    member_count: 5,
    created_at: daysAgo(20),
    updated_at: daysAgo(1),
  },
];

let mockMembers: Record<string, MockMember[]> = {
  'ws-1': [
    {
      user_id: 'user-1',
      email: 'owner@example.com',
      display_name: 'John Doe',
      avatar_url: null,
      role: 'owner',
      joined_at: daysAgo(30),
    },
  ],
  'ws-2': [
    {
      user_id: 'user-1',
      email: 'owner@example.com',
      display_name: 'John Doe',
      avatar_url: null,
      role: 'owner',
      joined_at: daysAgo(20),
    },
    {
      user_id: 'user-2',
      email: 'admin@example.com',
      display_name: 'Jane Smith',
      avatar_url: null,
      role: 'admin',
      joined_at: daysAgo(15),
    },
    {
      user_id: 'user-3',
      email: 'member1@example.com',
      display_name: 'Bob Wilson',
      avatar_url: null,
      role: 'member',
      joined_at: daysAgo(10),
    },
  ],
};

let mockInvitations: Record<string, MockInvitation[]> = {
  'ws-2': [
    {
      id: 'inv-1',
      workspace_id: 'ws-2',
      workspace_name: 'Team Alpha',
      email: 'newmember@example.com',
      role: 'member',
      invited_by_name: 'John Doe',
      status: 'pending',
      created_at: daysAgo(2),
      expires_at: daysAgo(-5), // expires in 5 days
    },
  ],
};

let mockActivity: Record<string, MockActivityEntry[]> = {
  'ws-1': [
    {
      id: 'act-1',
      actor_id: 'user-1',
      actor_name: 'John Doe',
      actor_avatar_url: null,
      action: 'created',
      entity_type: 'todo',
      entity_id: 'todo-1',
      entity_title: 'New Task',
      changes: null,
      created_at: hoursAgo(2),
    },
  ],
  'ws-2': [
    {
      id: 'act-2',
      actor_id: 'user-2',
      actor_name: 'Jane Smith',
      actor_avatar_url: null,
      action: 'completed',
      entity_type: 'todo',
      entity_id: 'todo-2',
      entity_title: 'Important Task',
      changes: { is_completed: { old: false, new: true } },
      created_at: hoursAgo(1),
    },
    {
      id: 'act-3',
      actor_id: 'user-1',
      actor_name: 'John Doe',
      actor_avatar_url: null,
      action: 'added_member',
      entity_type: 'workspace',
      entity_id: 'ws-2',
      entity_title: 'Team Alpha',
      changes: null,
      created_at: daysAgo(15),
    },
  ],
};

let mockGroups: Record<string, MockGroup[]> = {
  'ws-2': [
    {
      id: 'grp-1',
      workspace_id: 'ws-2',
      name: 'Developers',
      description: 'Development team members',
      member_count: 2,
      created_at: daysAgo(10),
    },
    {
      id: 'grp-2',
      workspace_id: 'ws-2',
      name: 'Designers',
      description: 'Design team members',
      member_count: 1,
      created_at: daysAgo(8),
    },
  ],
};

let mockGroupMembers: Record<string, MockGroupMember[]> = {
  'grp-1': [
    {
      user_id: 'user-2',
      display_name: 'Jane Smith',
      email: 'admin@example.com',
      avatar_url: null,
      role: 'admin',
      joined_at: daysAgo(10),
    },
    {
      user_id: 'user-3',
      display_name: 'Bob Wilson',
      email: 'member1@example.com',
      avatar_url: null,
      role: 'member',
      joined_at: daysAgo(9),
    },
  ],
  'grp-2': [
    {
      user_id: 'user-3',
      display_name: 'Bob Wilson',
      email: 'member1@example.com',
      avatar_url: null,
      role: 'member',
      joined_at: daysAgo(8),
    },
  ],
};

let mockNotifications: MockNotification[] = [
  {
    id: 'notif-1',
    type: 'workspace_invitation',
    actor_name: 'John Doe',
    actor_avatar_url: null,
    entity_type: 'workspace',
    entity_id: 'ws-2',
    message: 'John Doe invited you to Team Alpha',
    is_read: false,
    is_seen: false,
    created_at: minutesAgo(30),
  },
  {
    id: 'notif-2',
    type: 'task_assigned',
    actor_name: 'Jane Smith',
    actor_avatar_url: null,
    entity_type: 'todo',
    entity_id: 'todo-5',
    message: 'Jane Smith assigned you a task',
    is_read: false,
    is_seen: true,
    created_at: hoursAgo(3),
  },
  {
    id: 'notif-3',
    type: 'task_completed',
    actor_name: 'Bob Wilson',
    actor_avatar_url: null,
    entity_type: 'todo',
    entity_id: 'todo-3',
    message: 'Bob Wilson completed a task you created',
    is_read: true,
    is_seen: true,
    created_at: daysAgo(1),
  },
];

let mockNotificationPreferences: MockNotificationPreferences = {
  workspace_invitation: { in_app: true, email: true },
  task_assigned: { in_app: true, email: true },
  task_completed: { in_app: true, email: false },
  task_commented: { in_app: true, email: false },
  member_added: { in_app: true, email: false },
};

export const workspaceHandlers = [
  // Workspaces - List
  http.get(`${API_URL}/workspaces`, () => {
    return HttpResponse.json({
      data: mockWorkspaces,
      meta: { total: mockWorkspaces.length },
    });
  }),

  // Workspaces - Create
  http.post(`${API_URL}/workspaces`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newWorkspace: MockWorkspace = {
      id: `ws-${Date.now()}`,
      name: body.name as string,
      slug: (body.name as string).toLowerCase().replace(/\s+/g, '-'),
      description: (body.description as string) || null,
      created_by: 'user-1',
      member_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockWorkspaces.push(newWorkspace);
    // Add creator as owner
    mockMembers[newWorkspace.id] = [
      {
        user_id: 'user-1',
        email: 'owner@example.com',
        display_name: 'John Doe',
        avatar_url: null,
        role: 'owner',
        joined_at: new Date().toISOString(),
      },
    ];
    return HttpResponse.json({ data: newWorkspace }, { status: 201 });
  }),

  // Workspaces - Get by ID
  http.get(`${API_URL}/workspaces/:id`, ({ params }) => {
    const workspace = mockWorkspaces.find((w) => w.id === params.id);
    if (!workspace) {
      return HttpResponse.json(
        { error_code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: workspace });
  }),

  // Workspaces - Update
  http.patch(`${API_URL}/workspaces/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const workspace = mockWorkspaces.find((w) => w.id === params.id);
    if (!workspace) {
      return HttpResponse.json(
        { error_code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        { status: 404 }
      );
    }
    if (body.name) workspace.name = body.name as string;
    if (body.description !== undefined)
      workspace.description = body.description as string | null;
    workspace.updated_at = new Date().toISOString();
    return HttpResponse.json({ data: workspace });
  }),

  // Workspaces - Delete
  http.delete(`${API_URL}/workspaces/:id`, ({ params }) => {
    mockWorkspaces = mockWorkspaces.filter((w) => w.id !== params.id);
    delete mockMembers[params.id as string];
    delete mockInvitations[params.id as string];
    delete mockActivity[params.id as string];
    delete mockGroups[params.id as string];
    return new HttpResponse(null, { status: 204 });
  }),

  // Members - List
  http.get(`${API_URL}/workspaces/:id/members`, ({ params }) => {
    const members = mockMembers[params.id as string] || [];
    return HttpResponse.json({
      data: members,
      meta: { total: members.length },
    });
  }),

  // Members - Add
  http.post(`${API_URL}/workspaces/:id/members`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const workspaceId = params.id as string;
    if (!mockMembers[workspaceId]) mockMembers[workspaceId] = [];

    const newMember: MockMember = {
      user_id: body.user_id as string,
      email: body.email as string,
      display_name: (body.display_name as string) || null,
      avatar_url: null,
      role: (body.role as MockMember['role']) || 'member',
      joined_at: new Date().toISOString(),
    };
    mockMembers[workspaceId].push(newMember);

    // Update member count
    const workspace = mockWorkspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      workspace.member_count = mockMembers[workspaceId].length;
    }

    return HttpResponse.json({ data: newMember }, { status: 201 });
  }),

  // Members - Update role
  http.patch(`${API_URL}/workspaces/:id/members/:userId`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const workspaceId = params.id as string;
    const userId = params.userId as string;
    const members = mockMembers[workspaceId];

    if (!members) {
      return HttpResponse.json(
        { error_code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        { status: 404 }
      );
    }

    const member = members.find((m) => m.user_id === userId);
    if (!member) {
      return HttpResponse.json(
        { error_code: 'MEMBER_NOT_FOUND', message: 'Member not found' },
        { status: 404 }
      );
    }

    if (body.role) member.role = body.role as MockMember['role'];
    return HttpResponse.json({ data: member });
  }),

  // Members - Remove
  http.delete(`${API_URL}/workspaces/:id/members/:userId`, ({ params }) => {
    const workspaceId = params.id as string;
    const userId = params.userId as string;
    if (mockMembers[workspaceId]) {
      mockMembers[workspaceId] = mockMembers[workspaceId].filter(
        (m) => m.user_id !== userId
      );
      // Update member count
      const workspace = mockWorkspaces.find((w) => w.id === workspaceId);
      if (workspace) {
        workspace.member_count = mockMembers[workspaceId].length;
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Invitations - List workspace invitations
  http.get(`${API_URL}/workspaces/:id/invitations`, ({ params }) => {
    const invitations = mockInvitations[params.id as string] || [];
    return HttpResponse.json({
      data: invitations,
      meta: { total: invitations.length },
    });
  }),

  // Invitations - Create
  http.post(`${API_URL}/workspaces/:id/invitations`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const workspaceId = params.id as string;
    if (!mockInvitations[workspaceId]) mockInvitations[workspaceId] = [];

    const workspace = mockWorkspaces.find((w) => w.id === workspaceId);
    const newInvitation: MockInvitation = {
      id: `inv-${Date.now()}`,
      workspace_id: workspaceId,
      workspace_name: workspace?.name || 'Unknown Workspace',
      email: body.email as string,
      role: (body.role as MockInvitation['role']) || 'member',
      invited_by_name: 'John Doe',
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: daysAgo(-7), // expires in 7 days
    };
    mockInvitations[workspaceId].push(newInvitation);
    return HttpResponse.json({ data: newInvitation }, { status: 201 });
  }),

  // Invitations - Revoke
  http.delete(`${API_URL}/workspaces/:id/invitations/:invId`, ({ params }) => {
    const workspaceId = params.id as string;
    const invId = params.invId as string;
    if (mockInvitations[workspaceId]) {
      const invitation = mockInvitations[workspaceId].find((inv) => inv.id === invId);
      if (invitation) {
        invitation.status = 'revoked';
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Invitations - List user pending invitations
  http.get(`${API_URL}/invitations/pending`, () => {
    const allPending: MockInvitation[] = [];
    Object.values(mockInvitations).forEach((workspaceInvs) => {
      allPending.push(...workspaceInvs.filter((inv) => inv.status === 'pending'));
    });
    return HttpResponse.json({
      data: allPending,
      meta: { total: allPending.length },
    });
  }),

  // Invitations - Accept
  http.post(`${API_URL}/invitations/:token/accept`, ({ params }) => {
    // Find invitation by token (in real app, token would be used)
    let foundInvitation: MockInvitation | null = null;
    let foundWorkspaceId: string | null = null;

    Object.entries(mockInvitations).forEach(([workspaceId, invs]) => {
      const inv = invs.find((i) => i.id === params.token);
      if (inv) {
        foundInvitation = inv;
        foundWorkspaceId = workspaceId;
      }
    });

    if (!foundInvitation || !foundWorkspaceId) {
      return HttpResponse.json(
        { error_code: 'INVITATION_NOT_FOUND', message: 'Invitation not found' },
        { status: 404 }
      );
    }

    foundInvitation.status = 'accepted';

    // Add member to workspace
    if (!mockMembers[foundWorkspaceId]) mockMembers[foundWorkspaceId] = [];
    mockMembers[foundWorkspaceId].push({
      user_id: `user-${Date.now()}`,
      email: foundInvitation.email,
      display_name: null,
      avatar_url: null,
      role: foundInvitation.role,
      joined_at: new Date().toISOString(),
    });

    return HttpResponse.json({ data: { success: true } });
  }),

  // Activity - List workspace activity
  http.get(`${API_URL}/workspaces/:id/activity`, ({ params }) => {
    const activity = mockActivity[params.id as string] || [];
    return HttpResponse.json({
      data: activity,
      meta: { total: activity.length },
    });
  }),

  // Groups - List
  http.get(`${API_URL}/workspaces/:id/groups`, ({ params }) => {
    const groups = mockGroups[params.id as string] || [];
    return HttpResponse.json({
      data: groups,
      meta: { total: groups.length },
    });
  }),

  // Groups - Create
  http.post(`${API_URL}/workspaces/:id/groups`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const workspaceId = params.id as string;
    if (!mockGroups[workspaceId]) mockGroups[workspaceId] = [];

    const newGroup: MockGroup = {
      id: `grp-${Date.now()}`,
      workspace_id: workspaceId,
      name: body.name as string,
      description: (body.description as string) || null,
      member_count: 0,
      created_at: new Date().toISOString(),
    };
    mockGroups[workspaceId].push(newGroup);
    return HttpResponse.json({ data: newGroup }, { status: 201 });
  }),

  // Groups - Get by ID
  http.get(`${API_URL}/workspaces/:id/groups/:groupId`, ({ params }) => {
    const groups = mockGroups[params.id as string] || [];
    const group = groups.find((g) => g.id === params.groupId);
    if (!group) {
      return HttpResponse.json(
        { error_code: 'GROUP_NOT_FOUND', message: 'Group not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: group });
  }),

  // Groups - Update
  http.patch(`${API_URL}/workspaces/:id/groups/:groupId`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const groups = mockGroups[params.id as string] || [];
    const group = groups.find((g) => g.id === params.groupId);
    if (!group) {
      return HttpResponse.json(
        { error_code: 'GROUP_NOT_FOUND', message: 'Group not found' },
        { status: 404 }
      );
    }
    if (body.name) group.name = body.name as string;
    if (body.description !== undefined) group.description = body.description as string | null;
    return HttpResponse.json({ data: group });
  }),

  // Groups - Delete
  http.delete(`${API_URL}/workspaces/:id/groups/:groupId`, ({ params }) => {
    const workspaceId = params.id as string;
    const groupId = params.groupId as string;
    if (mockGroups[workspaceId]) {
      mockGroups[workspaceId] = mockGroups[workspaceId].filter((g) => g.id !== groupId);
    }
    delete mockGroupMembers[groupId];
    return new HttpResponse(null, { status: 204 });
  }),

  // Group Members - List
  http.get(`${API_URL}/workspaces/:id/groups/:groupId/members`, ({ params }) => {
    const members = mockGroupMembers[params.groupId as string] || [];
    return HttpResponse.json({
      data: members,
      meta: { total: members.length },
    });
  }),

  // Group Members - Add
  http.post(`${API_URL}/workspaces/:id/groups/:groupId/members`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const groupId = params.groupId as string;
    if (!mockGroupMembers[groupId]) mockGroupMembers[groupId] = [];

    const newMember: MockGroupMember = {
      user_id: body.user_id as string,
      display_name: (body.display_name as string) || null,
      email: body.email as string,
      avatar_url: null,
      role: (body.role as MockGroupMember['role']) || 'member',
      joined_at: new Date().toISOString(),
    };
    mockGroupMembers[groupId].push(newMember);

    // Update member count
    const groups = mockGroups[params.id as string] || [];
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      group.member_count = mockGroupMembers[groupId].length;
    }

    return HttpResponse.json({ data: newMember }, { status: 201 });
  }),

  // Group Members - Remove
  http.delete(`${API_URL}/workspaces/:id/groups/:groupId/members/:userId`, ({ params }) => {
    const groupId = params.groupId as string;
    const userId = params.userId as string;
    if (mockGroupMembers[groupId]) {
      mockGroupMembers[groupId] = mockGroupMembers[groupId].filter(
        (m) => m.user_id !== userId
      );
      // Update member count
      const groups = mockGroups[params.id as string] || [];
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        group.member_count = mockGroupMembers[groupId].length;
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Notifications - List
  http.get(`${API_URL}/notifications`, () => {
    return HttpResponse.json({
      data: mockNotifications,
      meta: { total: mockNotifications.length },
    });
  }),

  // Notifications - Unread count
  http.get(`${API_URL}/notifications/unread-count`, () => {
    const unreadCount = mockNotifications.filter((n) => !n.is_read).length;
    return HttpResponse.json({ data: { count: unreadCount } });
  }),

  // Notifications - Mark as read
  http.patch(`${API_URL}/notifications/:id/read`, ({ params }) => {
    const notification = mockNotifications.find((n) => n.id === params.id);
    if (!notification) {
      return HttpResponse.json(
        { error_code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' },
        { status: 404 }
      );
    }
    notification.is_read = true;
    notification.is_seen = true;
    return HttpResponse.json({ data: notification });
  }),

  // Notifications - Mark all as read
  http.post(`${API_URL}/notifications/read-all`, () => {
    mockNotifications.forEach((n) => {
      n.is_read = true;
      n.is_seen = true;
    });
    return HttpResponse.json({ data: { success: true } });
  }),

  // Notifications - Get preferences
  http.get(`${API_URL}/notifications/preferences`, () => {
    return HttpResponse.json({ data: mockNotificationPreferences });
  }),

  // Notifications - Update preferences
  http.patch(`${API_URL}/notifications/preferences`, async ({ request }) => {
    const body = (await request.json()) as MockNotificationPreferences;
    Object.assign(mockNotificationPreferences, body);
    return HttpResponse.json({ data: mockNotificationPreferences });
  }),
];

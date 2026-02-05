import {
  createClient,
  type SupabaseClient,
  type RealtimeChannel,
  type RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────

export type ConnectionStatus = 'idle' | 'connected' | 'connecting' | 'disconnected';

export type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeCallbacks {
  onTodoChange?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onTagChange?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onMemberChange?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onActivityChange?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
}

export interface NotificationRealtimeCallbacks {
  onNewNotification?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onSubscriptionStatus?: (status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED') => void;
}

export interface PresenceUser {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeen: string;
  viewingTaskId: string | null;
}

export interface PresenceCallbacks {
  onSync?: (users: PresenceUser[]) => void;
  onJoin?: (user: PresenceUser) => void;
  onLeave?: (user: PresenceUser) => void;
}

export interface ConnectionCallbacks {
  onStatusChange?: (status: ConnectionStatus) => void;
}

// ─── Manager ──────────────────────────────────────────────────────────

class RealtimeManager {
  private client: SupabaseClient | null = null;
  private channels = new Map<string, RealtimeChannel>();
  private presenceChannels = new Map<string, RealtimeChannel>();
  private connectedChannels = new Set<string>();
  private connectionStatus: ConnectionStatus = 'idle';
  private connectionCallbacks: ConnectionCallbacks = {};

  /**
   * Initialize with Supabase credentials. Safe to call multiple times;
   * subsequent calls are no-ops if already initialized.
   */
  initialize(): void {
    if (this.client) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[Realtime] Supabase credentials missing – realtime disabled');
      return;
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    });
  }

  // ── Auth ─────────────────────────────────────────────────────────

  /**
   * Set the access token on the Supabase Realtime client.
   * Required for RLS policies (e.g., `notification_recipients` filters by `auth.uid()`).
   * Call after login, session restore, and token refresh.
   */
  setAuth(accessToken: string): void {
    if (!this.client) {
      this.initialize();
    }
     
    void this.client?.realtime.setAuth(accessToken);
  }

  // ── Connection ────────────────────────────────────────────────────

  setConnectionCallbacks(callbacks: ConnectionCallbacks): void {
    this.connectionCallbacks = callbacks;
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  private setStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.connectionCallbacks.onStatusChange?.(status);
  }

  /**
   * Derive overall connection status from per-channel state.
   * 'connected' if ANY channel is subscribed, 'connecting' if channels exist
   * but none subscribed yet, 'disconnected' if all channels failed.
   */
  private updateConnectionStatus(): void {
    if (this.connectedChannels.size > 0) {
      this.setStatus('connected');
    } else if (this.channels.size > 0) {
      this.setStatus('disconnected');
    }
  }

  // ── Workspace subscription (Postgres Changes) ─────────────────────

  subscribeToWorkspace(workspaceId: string, callbacks: RealtimeCallbacks): void {
    if (!this.client) {
      this.initialize();
    }
     
    if (!this.client) return;

    // Avoid duplicate subscriptions
    const channelName = `workspace:${workspaceId}`;
    if (this.channels.has(channelName)) return;

    const channel = this.client.channel(channelName);

    // Listen for todo changes
    if (callbacks.onTodoChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        callbacks.onTodoChange,
      );
    }

    // Listen for tag changes
    if (callbacks.onTagChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tags',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        callbacks.onTagChange,
      );
    }

    // Listen for member changes
    if (callbacks.onMemberChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        callbacks.onMemberChange,
      );
    }

    // Listen for activity changes
    if (callbacks.onActivityChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_log',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        callbacks.onActivityChange,
      );
    }

    this.channels.set(channelName, channel);
    this.setStatus('connecting');

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        this.connectedChannels.add(channelName);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        this.connectedChannels.delete(channelName);
      }
      this.updateConnectionStatus();
    });
  }

  unsubscribeFromWorkspace(workspaceId: string): void {
    const channelName = `workspace:${workspaceId}`;
    const channel = this.channels.get(channelName);
    if (channel) {
      void this.client?.removeChannel(channel);
      this.channels.delete(channelName);
      this.connectedChannels.delete(channelName);
      this.updateConnectionStatus();
    }
  }

  // ── Presence ──────────────────────────────────────────────────────

  subscribeToPresence(workspaceId: string, callbacks: PresenceCallbacks): void {
    if (!this.client) {
      this.initialize();
    }
     
    if (!this.client) return;

    const channelName = `presence:${workspaceId}`;
    if (this.presenceChannels.has(channelName)) return;

    const channel = this.client.channel(channelName, {
      config: { presence: { key: 'users' } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceUser>();
      const users: PresenceUser[] = [];
      for (const key of Object.keys(state)) {
        const presences = state[key];
        users.push(...(presences as unknown as PresenceUser[]));
      }
      callbacks.onSync?.(users);
    });

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      for (const presence of newPresences) {
        callbacks.onJoin?.(presence as unknown as PresenceUser);
      }
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      for (const presence of leftPresences) {
        callbacks.onLeave?.(presence as unknown as PresenceUser);
      }
    });

    channel.subscribe();
    this.presenceChannels.set(channelName, channel);
  }

  unsubscribeFromPresence(workspaceId: string): void {
    const channelName = `presence:${workspaceId}`;
    const channel = this.presenceChannels.get(channelName);
    if (channel) {
      void this.client?.removeChannel(channel);
      this.presenceChannels.delete(channelName);
    }
  }

  /**
   * Publish own presence state. Merges with existing presence data.
   */
  async updatePresence(workspaceId: string, data: Partial<PresenceUser>): Promise<void> {
    const channelName = `presence:${workspaceId}`;
    const channel = this.presenceChannels.get(channelName);
    if (!channel) return;

    await channel.track(data);
  }

  // ── Notifications (User-scoped) ─────────────────────────────────

  subscribeToNotifications(userId: string, callbacks: NotificationRealtimeCallbacks): void {
    if (!this.client) {
      this.initialize();
    }
     
    if (!this.client) return;

    const channelName = `notifications:${userId}`;
    if (this.channels.has(channelName)) return;

    const channel = this.client.channel(channelName);

    if (callbacks.onNewNotification) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          filter: `recipient_id=eq.${userId}`,
        },
        callbacks.onNewNotification,
      );
    }

    this.channels.set(channelName, channel);

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        this.connectedChannels.add(channelName);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        this.connectedChannels.delete(channelName);
      }
      this.updateConnectionStatus();
      callbacks.onSubscriptionStatus?.(
        status as 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED',
      );
    });
  }

  unsubscribeFromNotifications(userId: string): void {
    const channelName = `notifications:${userId}`;
    const channel = this.channels.get(channelName);
    if (channel) {
      void this.client?.removeChannel(channel);
      this.channels.delete(channelName);
      this.connectedChannels.delete(channelName);
      this.updateConnectionStatus();
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────

  /**
   * Unsubscribe from all channels. Call on logout or app unmount.
   */
  cleanup(): void {
    for (const channel of this.channels.values()) {
      void this.client?.removeChannel(channel);
    }
    this.channels.clear();

    for (const channel of this.presenceChannels.values()) {
      void this.client?.removeChannel(channel);
    }
    this.presenceChannels.clear();

    this.connectedChannels.clear();
    this.setStatus('idle');
  }
}

// Singleton instance
export const realtimeManager = new RealtimeManager();

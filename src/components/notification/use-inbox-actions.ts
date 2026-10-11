"use client";

import { api } from "~/utils/api";

/** Mark read / unread / delete, then refresh the list and the header badge. */
export function useInboxActions() {
  const utils = api.useUtils();
  const refresh = () => Promise.all([utils.notification.list.invalidate(), utils.notification.unseenCount.invalidate(), utils.notification.unreadByCategory.invalidate()]);
  const opts = { onSuccess: () => void refresh() };
  return {
    markRead: api.notification.markRead.useMutation(opts),
    markUnread: api.notification.markUnread.useMutation(opts),
    markAllRead: api.notification.markAllRead.useMutation(opts),
    remove: api.notification.remove.useMutation(opts),
    clearRead: api.notification.clearRead.useMutation(opts),
  };
}

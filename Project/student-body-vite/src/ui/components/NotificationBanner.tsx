interface Notification {
  app: string;
  body: string;
}

interface NotificationBannerProps {
  notification: Notification | null;
  onDismiss: () => void;
  onTap: () => void;
}

export function NotificationBanner({ notification, onDismiss, onTap }: NotificationBannerProps) {
  if (!notification) return null;

  return (
    <button className="notification-banner" type="button" onClick={onTap}>
      <span className="notification-banner__app">{notification.app}</span>
      <span className="notification-banner__body">{notification.body}</span>
      <span
        className="notification-banner__close"
        onClick={event => {
          event.stopPropagation();
          onDismiss();
        }}
      >
        x
      </span>
    </button>
  );
}

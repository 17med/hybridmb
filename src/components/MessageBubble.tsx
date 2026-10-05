import type { CSSProperties } from 'react';
import type { Message } from '../appwrite/messagesRepository';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const rowStyle = (isOwn: boolean): CSSProperties => ({
  display: 'flex',
  justifyContent: isOwn ? 'flex-end' : 'flex-start',
  margin: '6px 0',
});

const bubbleStyle = (isOwn: boolean): CSSProperties => ({
  maxWidth: '78%',
  padding: '8px 12px',
  borderRadius: 16,
  background: isOwn ? 'var(--ion-color-primary)' : 'var(--ion-color-light)',
  color: isOwn ? 'var(--ion-color-primary-contrast)' : 'var(--ion-color-light-contrast)',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});

const metaStyle: CSSProperties = { fontSize: 11, opacity: 0.75, marginBottom: 2 };

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => (
  <div style={rowStyle(isOwn)}>
    <div style={bubbleStyle(isOwn)}>
      <div style={metaStyle}>
        {isOwn ? 'You' : message.userName} · {formatTime(message.createdAt)}
      </div>
      {message.body}
    </div>
  </div>
);

export default MessageBubble;

import type { Message } from '../appwrite/messagesRepository';
import Avatar from './Avatar';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** One message. Avatar and name show on a group's first bubble, the time on its last. */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, isFirstInGroup, isLastInGroup }) => {
  const classes = ['message-row', isOwn && 'is-own', isFirstInGroup && 'is-first', isLastInGroup && 'is-last'];
  return (
    <div className={classes.filter(Boolean).join(' ')}>
      {!isOwn && (
        <div className="avatar-slot">
          {isLastInGroup && <Avatar userId={message.userId} name={message.userName} />}
        </div>
      )}
      <div className="message-stack">
        {!isOwn && isFirstInGroup && <div className="message-author">{message.userName}</div>}
        <div className="bubble">{message.body}</div>
        {isLastInGroup && <div className="message-time">{formatTime(message.createdAt)}</div>}
      </div>
    </div>
  );
};

export default MessageBubble;

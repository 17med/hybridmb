import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { AppwriteException } from 'appwrite';
import type { RealtimeSubscription } from 'appwrite';
import { chatbubbles, chatbubblesOutline, logOutOutline, send } from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Author,
  listRecentMessages,
  MAX_MESSAGE_LENGTH,
  Message,
  sendMessage,
  subscribeToNewMessages,
} from '../appwrite/messagesRepository';
import { listPresence, markTyping, sendHeartbeat, subscribeToPresence } from '../appwrite/presenceRepository';
import { useAuth } from '../auth/AuthContext';
import MessageBubble from '../components/MessageBubble';
import { buildTimeline } from '../chat/messageLayout';
import {
  describeTyping,
  HEARTBEAT_INTERVAL_MS,
  onlineUsers,
  Presence,
  typingUserNames,
} from '../chat/presenceRules';
import './ChatRoom.css';

// Re-render cadence for time-based state (typing expiry, offline detection) when no event arrives.
const CLOCK_TICK_MS = 1_000;
// Do not send a typing update on every keystroke; one per window is enough.
const TYPING_THROTTLE_MS = 2_000;

/**
 * Appends Appwrite's own reason (e.g. "Table with the requested ID could not be found.") so setup
 * problems are diagnosable on the device. Appwrite error messages carry no personal data.
 */
function withReason(summary: string, error: unknown): string {
  return error instanceof AppwriteException ? `${summary} ${error.message}` : summary;
}

/** Subscribes once, and unsubscribes correctly even if unmounted before subscribe resolves. */
function useRealtime(subscribe: () => Promise<RealtimeSubscription>, onError: (error: unknown) => void) {
  useEffect(() => {
    let subscription: RealtimeSubscription | null = null;
    let isCancelled = false;
    subscribe()
      .then((s) => {
        if (isCancelled) return s.unsubscribe();
        subscription = s;
      })
      .catch(onError);
    return () => {
      isCancelled = true;
      subscription?.unsubscribe();
    };
  }, [subscribe, onError]);
}

function addIfMissing(messages: Message[], incoming: Message): Message[] {
  if (messages.some((m) => m.id === incoming.id)) return messages;
  return [...messages, incoming];
}

function useMessages(onError: (text: string) => void) {
  const [messages, setMessages] = useState<Message[]>([]);

  const reload = useCallback(() => {
    listRecentMessages()
      .then(setMessages)
      // Fails open: keep showing what we have; the user is told history could not refresh.
      .catch((error) => onError(withReason('Could not load messages.', error)));
  }, [onError]);

  useEffect(() => {
    reload();
    // Realtime drops while the app is backgrounded, so catch up on return.
    const onVisible = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [reload]);

  const subscribe = useCallback(
    () => subscribeToNewMessages((m) => setMessages((prev) => addIfMissing(prev, m))),
    [],
  );
  // Fails open: the chat still sends and reloads, only live delivery is lost.
  const onSubscribeError = useCallback(
    (error: unknown) => onError(withReason('Live updates unavailable.', error)),
    [onError],
  );
  useRealtime(subscribe, onSubscribeError);

  const append = useCallback((m: Message) => setMessages((prev) => addIfMissing(prev, m)), []);
  return { messages, append };
}

function usePresence(user: Author) {
  const [presenceById, setPresenceById] = useState<Record<string, Presence>>({});
  const [now, setNow] = useState(() => new Date());

  const upsertLocal = useCallback(
    (p: Presence) => setPresenceById((prev) => ({ ...prev, [p.userId]: p })),
    [],
  );

  useEffect(() => {
    // Presence fails open everywhere below: chatting works without the online list.
    listPresence()
      .then((all) => all.forEach(upsertLocal))
      .catch(() => undefined);
    const beat = () => sendHeartbeat(user).catch(() => undefined);
    beat();
    const heartbeat = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    const clock = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => {
      clearInterval(heartbeat);
      clearInterval(clock);
    };
  }, [user, upsertLocal]);

  const subscribe = useCallback(() => subscribeToPresence(upsertLocal), [upsertLocal]);
  const ignore = useCallback(() => undefined, []);
  useRealtime(subscribe, ignore);

  const all = Object.values(presenceById);
  return { online: onlineUsers(all, now), typingText: describeTyping(typingUserNames(all, user.id, now)) };
}

function useTypingSignal(user: Author) {
  const lastSentAt = useRef(0);
  return useCallback(() => {
    if (Date.now() - lastSentAt.current < TYPING_THROTTLE_MS) return;
    lastSentAt.current = Date.now();
    // Fails open: a missed typing hint is cosmetic.
    markTyping(user).catch(() => undefined);
  }, [user]);
}

interface ChatHeaderProps {
  online: Presence[];
  onLogout: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ online, onLogout }) => (
  <IonHeader className="chat-header">
    <IonToolbar>
      <IonTitle>
        <div className="chat-header-title">
          <div className="chat-header-logo">
            <IonIcon icon={chatbubbles} />
          </div>
          <div className="chat-header-text">
            <div className="chat-header-name">Global room</div>
            <div className="chat-header-online">
              <span className="online-dot" />
              {online.length} online · {online.map((p) => p.userName).join(', ')}
            </div>
          </div>
        </div>
      </IonTitle>
      <IonButtons slot="end">
        <IonButton onClick={onLogout} aria-label="Log out">
          <IonIcon slot="icon-only" icon={logOutOutline} />
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
);

const MessageList: React.FC<{ messages: Message[]; selfId: string }> = ({ messages, selfId }) => {
  const timeline = useMemo(() => buildTimeline(messages, new Date()), [messages]);
  if (messages.length === 0) {
    return (
      <div className="chat-empty">
        <IonIcon icon={chatbubblesOutline} />
        <strong>No messages yet</strong>
        <span>Say hi to everyone 👋</span>
      </div>
    );
  }
  return (
    <>
      {timeline.map((item) =>
        item.kind === 'day' ? (
          <div key={item.key} className="day-separator">
            <span>{item.label}</span>
          </div>
        ) : (
          <MessageBubble
            key={item.key}
            message={item.message}
            isOwn={item.message.userId === selfId}
            isFirstInGroup={item.isFirstInGroup}
            isLastInGroup={item.isLastInGroup}
          />
        ),
      )}
    </>
  );
};

const TypingIndicator: React.FC<{ text: string }> = ({ text }) => (
  <div className="typing-indicator" aria-live="polite">
    {text && (
      <>
        <span className="typing-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        {text}
      </>
    )}
  </div>
);

interface ComposerProps {
  draft: string;
  typingText: string;
  isSending: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
}

const Composer: React.FC<ComposerProps> = ({ draft, typingText, isSending, onDraftChange, onSend }) => (
  <IonFooter className="chat-footer">
    <TypingIndicator text={typingText} />
    <IonToolbar>
      <div className="composer">
        <IonTextarea
          className="composer-input"
          autoGrow
          rows={1}
          maxlength={MAX_MESSAGE_LENGTH}
          placeholder="Message…"
          value={draft}
          onIonInput={(e) => onDraftChange(e.detail.value ?? '')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button className="send-button" onClick={onSend} disabled={isSending || !draft.trim()} aria-label="Send">
          <IonIcon icon={send} />
        </button>
      </div>
    </IonToolbar>
  </IonFooter>
);

const ChatRoom: React.FC<{ user: Author }> = ({ user }) => {
  const { logout } = useAuth();
  const [presentToast] = useIonToast();
  const showError = useCallback(
    // Long enough to read Appwrite's reason on a phone.
    (text: string) => presentToast({ message: text, duration: 6000, color: 'danger' }),
    [presentToast],
  );
  const { messages, append } = useMessages(showError);
  const { online, typingText } = usePresence(user);
  const signalTyping = useTypingSignal(user);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const contentRef = useRef<HTMLIonContentElement>(null);

  useEffect(() => {
    contentRef.current?.scrollToBottom(200);
  }, [messages.length]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || isSending) return;
    setIsSending(true);
    try {
      append(await sendMessage(user, body));
      setDraft('');
    } catch (error) {
      // Fails closed: the message was not stored, so it stays in the input for a retry.
      showError(withReason('Message not sent.', error));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <IonPage>
      <ChatHeader online={online} onLogout={() => logout().catch(() => showError('Logout failed.'))} />
      <IonContent ref={contentRef} className="chat-content">
        <MessageList messages={messages} selfId={user.id} />
      </IonContent>
      <Composer
        draft={draft}
        typingText={typingText}
        isSending={isSending}
        onDraftChange={(value) => {
          setDraft(value);
          signalTyping();
        }}
        onSend={handleSend}
      />
    </IonPage>
  );
};

export default ChatRoom;

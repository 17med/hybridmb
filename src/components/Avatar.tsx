import { avatarHue, initialsOf } from '../chat/messageLayout';

/** Initials on a per-user gradient. Decorative (aria-hidden): callers give the accessible name. */
const Avatar: React.FC<{ userId: string; name: string }> = ({ userId, name }) => {
  const hue = avatarHue(userId);
  return (
    <div
      className="avatar"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 58%), hsl(${(hue + 40) % 360} 70% 48%))` }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  );
};

export default Avatar;

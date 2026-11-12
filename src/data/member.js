import { USER } from '../store/AppStore.jsx';

const MEMBER_KEY = 'foco-member';

/** The study cafe member signed up on this device, or null (demo account). */
export function getMember() {
  try {
    return JSON.parse(localStorage.getItem(MEMBER_KEY));
  } catch {
    return null;
  }
}

/** `{ name, phone, marketing }` */
export const saveMember = (member) => localStorage.setItem(MEMBER_KEY, JSON.stringify(member));

export const memberName = () => getMember()?.name ?? USER.name;

export const formatPhone = (digits) =>
  [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7, 11)].filter(Boolean).join('-');

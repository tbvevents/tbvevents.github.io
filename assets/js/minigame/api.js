// Đăng nhập Gmail, nhận MSNV và ghi điểm. Mọi kiểm tra thật sự nằm ở firestore.rules;
// ở đây chỉ gửi đúng dạng dữ liệu mà rules chấp nhận.
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  doc, getDoc, writeBatch, updateDoc, serverTimestamp, onSnapshot,
  collection, query, where, getCountFromServer,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { app, db, MY_MSNV_KEY } from '../firebase.js';

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const onUser = (cb) => onAuthStateChanged(auth, cb);
export const signIn = () => signInWithPopup(auth, provider);
export const logOut = () => {
  try { localStorage.removeItem(MY_MSNV_KEY); } catch { /* bỏ qua */ }
  return signOut(auth);
};

/** Chuẩn hoá MSNV người dùng gõ: bỏ khoảng trắng, viết hoa. */
export const normalizeMsnv = (s) => s.replace(/\s+/g, '').toUpperCase();

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

/** { name, claimed } hoặc null nếu MSNV không có trong danh sách. */
export async function lookupEmployee(msnv) {
  const snap = await getDoc(doc(db, 'employees', msnv));
  if (!snap.exists()) return null;
  const { name, claimedBy = null } = snap.data();
  return { name, claimed: claimedBy !== null && claimedBy !== auth.currentUser.uid };
}

/** Gắn Gmail đang đăng nhập với MSNV — một batch để rules kiểm tra chéo. */
export async function claimMsnv(msnv, name) {
  const user = auth.currentUser;
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', user.uid), { msnv, email: user.email, createdAt: serverTimestamp() });
  batch.update(doc(db, 'employees', msnv), { claimedBy: user.uid });
  batch.set(doc(db, 'scores', user.uid), {
    msnv, name, lixi: 0, quiz: 0, memory: 0, total: 0, updatedAt: serverTimestamp(), session: null,
  });
  await batch.commit();
  rememberMsnv(msnv);
}

export function rememberMsnv(msnv) {
  try { localStorage.setItem(MY_MSNV_KEY, msnv); } catch { /* bỏ qua */ }
}

export const watchMyScore = (uid, cb) => onSnapshot(doc(db, 'scores', uid), (s) => cb(s.exists() ? s.data() : null));

/** Bắt đầu một lượt: server ghi thời điểm bắt đầu. Phải xong trước khi game chạy. */
export const startSession = (game) => updateDoc(doc(db, 'scores', auth.currentUser.uid), {
  session: { game, startedAt: serverTimestamp() },
});

/**
 * Nộp điểm khi phá kỷ lục của game đó (điểm thấp hơn thì không cần ghi, tiết kiệm quota).
 * `current` là doc scores hiện tại. Trả về true nếu đã ghi kỷ lục mới.
 */
export async function submitScore(game, score, current) {
  if (score <= current[game]) return false;
  const next = { ...current, [game]: score };
  await updateDoc(doc(db, 'scores', auth.currentUser.uid), {
    [game]: score,
    total: next.lixi + next.quiz + next.memory,
    updatedAt: serverTimestamp(),
    session: null,
  });
  return true;
}

/** Hạng hiện tại = số người có tổng điểm cao hơn + 1 (1 lượt đọc / 1000 người). */
export async function myRank(total) {
  if (!total) return null;
  const snap = await getCountFromServer(query(collection(db, 'scores'), where('total', '>', total)));
  return snap.data().count + 1;
}

const keyInput = document.querySelector('#publishable-key');
const saveKeyButton = document.querySelector('#save-key');
const clearKeyButton = document.querySelector('#clear-key');
const configCard = document.querySelector('#config-card');
const authCard = document.querySelector('#auth-card');
const signedInCard = document.querySelector('#signed-in-card');
const authStatus = document.querySelector('#auth-status');
const authMount = document.querySelector('#clerk-auth');
const userId = document.querySelector('#user-id');
const username = document.querySelector('#username');
const signOutButton = document.querySelector('#sign-out');
const openProfileButton = document.querySelector('#open-profile');

const STORAGE_KEY = 'works_bp_clerk_publishable_key';
let clerk = null;

saveKeyButton.addEventListener('click', () => {
  const key = keyInput.value.trim();
  if (!key.startsWith('pk_')) {
    alert('Publishable Key（pk_...）を入力してください。');
    return;
  }
  localStorage.setItem(STORAGE_KEY, key);
  location.reload();
});

clearKeyButton.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

async function loadClerk(publishableKey) {
  const { Clerk } = await import('https://esm.sh/@clerk/clerk-js@latest');
  clerk = new Clerk(publishableKey);
  await clerk.load();
  return clerk;
}

function showSignedOut() {
  authStatus.textContent = '未ログイン';
  signedInCard.classList.add('hidden');
  authMount.innerHTML = '';
  clerk.mountSignIn(authMount, {
    appearance: {
      elements: {
        rootBox: { width: '100%' },
        cardBox: { width: '100%', boxShadow: 'none' },
        card: { width: '100%', boxShadow: 'none', padding: '0' }
      }
    }
  });
}

function showSignedIn() {
  authStatus.textContent = 'ログイン済み';
  signedInCard.classList.remove('hidden');
  userId.textContent = clerk.user?.id ?? '-';
  username.textContent = clerk.user?.username ?? '未設定';
  authMount.innerHTML = '<p class="hint">認証済みです。Passkey の登録・削除は「認証情報を管理」から確認します。</p>';
}

signOutButton.addEventListener('click', async () => {
  if (!clerk) return;
  await clerk.signOut();
});

openProfileButton.addEventListener('click', () => {
  if (!clerk) return;
  clerk.openUserProfile();
});

async function boot() {
  const key = localStorage.getItem(STORAGE_KEY);
  if (!key) {
    configCard.classList.remove('hidden');
    authCard.classList.add('hidden');
    return;
  }

  keyInput.value = key;
  configCard.classList.add('hidden');
  authCard.classList.remove('hidden');
  authStatus.textContent = '初期化中…';

  try {
    await loadClerk(key);
    if (clerk.user) showSignedIn(); else showSignedOut();

    clerk.addListener(({ user }) => {
      if (user) showSignedIn(); else showSignedOut();
    });
  } catch (error) {
    console.error(error);
    authStatus.textContent = '初期化エラー';
    authMount.innerHTML = '<p>Clerk の初期化に失敗しました。Publishable Key と Allowed Origins を確認してください。</p>';
  }
}

boot();

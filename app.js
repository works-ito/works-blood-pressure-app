const keyInput = document.querySelector('#publishable-key');
const configCard = document.querySelector('#config-card');
const authCard = document.querySelector('#auth-card');
const signedInCard = document.querySelector('#signed-in-card');
const authStatus = document.querySelector('#auth-status');
const authMount = document.querySelector('#clerk-auth');
const userId = document.querySelector('#user-id');
const username = document.querySelector('#username');
const signOutButton = document.querySelector('#sign-out');
const openProfileButton = document.querySelector('#open-profile');

const PUBLISHABLE_KEY = 'pk_test_Y29oZXJlbnQtaGFsaWJ1dC03MTIuY2xlcmsuYWNjb3VudHMuZGV2JA';
let clerk = null;

async function loadClerk(publishableKey) {
  const [{ Clerk }, { jaJP }] = await Promise.all([
    import('https://esm.sh/@clerk/clerk-js@latest'),
    import('https://esm.sh/@clerk/localizations@latest'),
  ]);

  const encodedDomain = publishableKey.split('_')[2];
  if (!encodedDomain) throw new Error('Invalid Clerk publishable key');

  const clerkDomain = atob(encodedDomain).slice(0, -1);

  await new Promise((resolve, reject) => {
    if (window.__internal_ClerkUICtor) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Clerk UI bundle failed to load'));
    document.head.appendChild(script);
  });

  clerk = new Clerk(publishableKey);
  await clerk.load({
    ui: { ClerkUI: window.__internal_ClerkUICtor },
    localization: jaJP,
  });

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
        card: { width: '100%', boxShadow: 'none', padding: '0' },
      },
    },
  });
}

function showSignedIn() {
  authStatus.textContent = 'ログイン済み';
  signedInCard.classList.remove('hidden');
  userId.textContent = clerk.user?.id ?? '-';
  username.textContent = clerk.user?.username ?? '未設定';
  authMount.innerHTML = '<p class="hint">認証済みです。Phase 0では社員番号＋パスワード認証を確認します。</p>';
}

signOutButton.addEventListener('click', async () => {
  if (!clerk) return;
  await clerk.signOut();
  showSignedOut();
});

openProfileButton.addEventListener('click', () => {
  if (!clerk) return;
  clerk.openUserProfile();
});

async function boot() {
  if (keyInput) keyInput.value = PUBLISHABLE_KEY;
  configCard.classList.add('hidden');
  authCard.classList.remove('hidden');
  authStatus.textContent = '初期化中…';

  try {
    await loadClerk(PUBLISHABLE_KEY);

    if (clerk.user) showSignedIn();
    else showSignedOut();

    clerk.addListener(({ user }) => {
      if (user) showSignedIn();
      else showSignedOut();
    });
  } catch (error) {
    console.error(error);
    authStatus.textContent = '初期化エラー';
    authMount.innerHTML = `<p>Clerk の初期化に失敗しました。</p><p class="hint">${String(error?.message || error)}</p>`;
  }
}

boot();

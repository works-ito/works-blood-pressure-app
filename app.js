const AUTH0_DOMAIN = 'dev-7d4p1aok5s6q6ifa.us.auth0.com';
const AUTH0_CLIENT_ID = 'aKdyIckH1X7nvkSvKeEFxSISb3m6Nkum';
const REDIRECT_URI = 'https://works-ito.github.io/works-blood-pressure-app/';

const authStatus = document.querySelector('#auth-status');
const signedOutView = document.querySelector('#signed-out-view');
const signedInCard = document.querySelector('#signed-in-card');
const authError = document.querySelector('#auth-error');
const userId = document.querySelector('#user-id');
const userLabel = document.querySelector('#user-label');
const loginButton = document.querySelector('#login');
const logoutButton = document.querySelector('#logout');

let auth0Client = null;

function showError(error) {
  console.error(error);
  authStatus.textContent = '認証エラー';
  authError.classList.remove('hidden');
  authError.innerHTML = `<p>Auth0 の認証処理でエラーが発生しました。</p><p class="hint">${String(error?.message || error)}</p>`;
}

function clearError() {
  authError.classList.add('hidden');
  authError.innerHTML = '';
}

async function renderAuthState() {
  const authenticated = await auth0Client.isAuthenticated();

  if (!authenticated) {
    authStatus.textContent = '未ログイン';
    signedOutView.classList.remove('hidden');
    signedInCard.classList.add('hidden');
    return;
  }

  const user = await auth0Client.getUser();
  authStatus.textContent = 'ログイン済み';
  signedOutView.classList.add('hidden');
  signedInCard.classList.remove('hidden');

  userId.textContent = user?.sub ?? '-';
  userLabel.textContent = user?.username ?? user?.nickname ?? user?.name ?? user?.email ?? '認証済み';
}

loginButton.addEventListener('click', async () => {
  if (!auth0Client) return;
  clearError();
  await auth0Client.loginWithRedirect({
    authorizationParams: {
      redirect_uri: REDIRECT_URI,
      ui_locales: 'ja',
    },
  });
});

logoutButton.addEventListener('click', async () => {
  if (!auth0Client) return;
  await auth0Client.logout({
    logoutParams: {
      returnTo: REDIRECT_URI,
    },
  });
});

async function boot() {
  try {
    clearError();
    authStatus.textContent = '初期化中…';

    auth0Client = await auth0.createAuth0Client({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: REDIRECT_URI,
        ui_locales: 'ja',
      },
    });

    const params = new URLSearchParams(window.location.search);
    if (params.has('code') && params.has('state')) {
      await auth0Client.handleRedirectCallback();
      window.history.replaceState({}, document.title, REDIRECT_URI);
    }

    await renderAuthState();
  } catch (error) {
    showError(error);
  }
}

boot();

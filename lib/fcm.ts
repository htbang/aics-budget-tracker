import admin from 'firebase-admin';

const FIREBASE_ADMIN_SDK_KEY = process.env.FIREBASE_ADMIN_SDK_KEY;

if (!FIREBASE_ADMIN_SDK_KEY) {
  console.warn('FIREBASE_ADMIN_SDK_KEY not set - FCM notifications will not work');
}

let adminApp: admin.app.App | null = null;

function getAdminApp(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }

  if (!FIREBASE_ADMIN_SDK_KEY) {
    throw new Error('FIREBASE_ADMIN_SDK_KEY not configured');
  }

  try {
    const serviceAccount = JSON.parse(FIREBASE_ADMIN_SDK_KEY);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return adminApp;
  } catch (error) {
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error}`);
  }
}

export interface FCMMessage {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data?: {
    [key: string]: string;
  };
  webpush?: {
    data?: {
      [key: string]: string;
    };
  };
}

export async function sendFCM(message: FCMMessage): Promise<string> {
  try {
    const app = getAdminApp();
    const messaging = admin.messaging(app);
    const response = await messaging.send(message);
    return response;
  } catch (error) {
    console.error('FCM send error:', error);
    throw error;
  }
}

export async function sendFCMMulticast(
  tokens: string[],
  notification: { title: string; body: string },
  data?: { [key: string]: string }
): Promise<{ successCount: number; failureCount: number; failedTokens: string[] }> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, failedTokens: [] };
  }

  try {
    const app = getAdminApp();
    const messaging = admin.messaging(app);

    const message = {
      notification,
      data,
    };

    const response = await messaging.sendMulticast({
      ...message,
      tokens,
    });

    const failedTokens: string[] = [];
    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        failedTokens.push(tokens[index]);
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
    };
  } catch (error) {
    console.error('FCM multicast error:', error);
    throw error;
  }
}

export async function subscribeToTopic(
  tokens: string[],
  topic: string
): Promise<{ successCount: number; failureCount: number }> {
  try {
    const app = getAdminApp();
    const messaging = admin.messaging(app);
    const response = await messaging.subscribeToTopic(tokens, topic);
    return response;
  } catch (error) {
    console.error('FCM subscribe error:', error);
    throw error;
  }
}

export async function unsubscribeFromTopic(
  tokens: string[],
  topic: string
): Promise<{ successCount: number; failureCount: number }> {
  try {
    const app = getAdminApp();
    const messaging = admin.messaging(app);
    const response = await messaging.unsubscribeFromTopic(tokens, topic);
    return response;
  } catch (error) {
    console.error('FCM unsubscribe error:', error);
    throw error;
  }
}

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { AppError } from '../middleware/error.middleware.js';
import { logger } from '../utils/logger.js';
let firebaseApp;
function initFirebase() {
    if (getApps().length > 0) {
        return getApps()[0];
    }
    if (process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY) {
        return initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });
    }
    throw new Error('Firebase Admin SDK is not configured. ' +
        'Set FIREBASE_SERVICE_ACCOUNT_JSON or ' +
        'FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.');
}
firebaseApp = initFirebase();
logger.info('Firebase Admin SDK initialised');
export async function verifyFirebaseToken(idToken) {
    try {
        const decoded = await getAuth(firebaseApp).verifyIdToken(idToken, true);
        return decoded;
    }
    catch (error) {
        logger.warn('Firebase token verification failed', { code: error.code });
        switch (error.code) {
            case 'auth/id-token-expired':
                throw new AppError('Google sign-in session expired. Please sign in again.', 401, 'FIREBASE_TOKEN_EXPIRED');
            case 'auth/id-token-revoked':
                throw new AppError('Google sign-in has been revoked. Please sign in again.', 401, 'FIREBASE_TOKEN_REVOKED');
            case 'auth/argument-error':
            case 'auth/invalid-id-token':
                throw new AppError('Invalid Google sign-in token.', 401, 'FIREBASE_TOKEN_INVALID');
            default:
                throw new AppError('Google sign-in verification failed.', 401, 'FIREBASE_AUTH_FAILED');
        }
    }
}
export { firebaseApp };
export default firebaseApp;
//# sourceMappingURL=firebase.js.map
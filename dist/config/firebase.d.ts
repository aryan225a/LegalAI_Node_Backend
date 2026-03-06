import { type App } from 'firebase-admin/app';
import { type DecodedIdToken } from 'firebase-admin/auth';
declare let firebaseApp: App;
export declare function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken>;
export { firebaseApp };
export default firebaseApp;
//# sourceMappingURL=firebase.d.ts.map
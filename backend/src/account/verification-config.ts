import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { validEmail } from "../auth/auth.schemas";
export function verificationConfiguration(env: Record<string, unknown>) {
 const key=typeof env.ACCOUNT_VERIFICATION_KEY==='string'?env.ACCOUNT_VERIFICATION_KEY:'';
 const from=typeof env.EMAIL_FROM==='string'?env.EMAIL_FROM.trim():'';
 const apiKey=typeof env.RESEND_API_KEY==='string'?env.RESEND_API_KEY.trim():'';
 const validKey=/^[a-f0-9]{64}$/.test(key);
 const canQueue=validKey&&validEmail(from);
 return {key,from,apiKey,canQueue,canDeliver:env.EMAIL_ENABLED==='true'&&canQueue&&!!apiKey&&!/[\s\x00-\x1f\x7f]/.test(apiKey)};
}
export function encryptVerificationToken(token:string,key:string):string {
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(key,'hex'),iv);
 const encrypted=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);
 return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');
}
export function decryptVerificationToken(payload:string,key:string):string {
 const data=Buffer.from(payload,'base64url');if(data.length!==71)throw new Error('Invalid encrypted verification payload');
 const decipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),data.subarray(0,12));decipher.setAuthTag(data.subarray(12,28));
 const token=Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString('utf8');if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw new Error('Invalid verification token');return token;
}

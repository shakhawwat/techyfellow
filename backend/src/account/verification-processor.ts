import {randomBytes} from 'node:crypto';
import type {Model} from 'mongoose';
import {hashToken} from '../auth/auth-http';
import type {UserRecord} from '../auth/auth.schemas';
import {EmailProviderError,type EmailProvider} from '../notifications/email-provider';
import type {VerificationRecord,VerificationJobRecord} from './account.schemas';
import {decryptVerificationToken,type verificationConfiguration} from './verification-config';
export class VerificationProcessor{
 constructor(private readonly jobs:Model<VerificationJobRecord>,private readonly verifications:Model<VerificationRecord>,private readonly users:Model<UserRecord>,private readonly config:ReturnType<typeof verificationConfiguration>,private readonly provider:EmailProvider){}
 async processOne():Promise<'paused'|'idle'|'sent'|'retry'|'failed'|'lease_lost'>{
 if(!this.config.canDeliver)return 'paused';
 const now=new Date(),leaseToken=randomBytes(24).toString('hex');
 await this.jobs.updateMany({status:{$in:['pending','processing']},$or:[{expiresAt:{$lte:now}},{attempts:{$gte:5},leaseExpiresAt:{$lte:now}}]},{$set:{status:'failed'},$unset:{encryptedToken:1,leaseToken:1,leaseExpiresAt:1}}).maxTimeMS(1500);
 const job=await this.jobs.findOneAndUpdate({expiresAt:{$gt:now},attempts:{$lt:5},$or:[{status:'pending',nextAttemptAt:{$lte:now}},{status:'processing',leaseExpiresAt:{$lte:now}}]},{$set:{status:'processing',leaseToken,leaseExpiresAt:new Date(Date.now()+60000)},$inc:{attempts:1}},{new:true,sort:{nextAttemptAt:1,_id:1}}).select('+encryptedToken').maxTimeMS(1500).lean();if(!job)return 'idle';
 const fence={_id:job._id,status:'processing' as const,leaseToken,leaseExpiresAt:{$gt:new Date()}};
 const finish=async()=>{const saved=await this.jobs.updateOne(fence,{$set:{status:'failed'},$unset:{encryptedToken:1,leaseToken:1,leaseExpiresAt:1}}).maxTimeMS(1500);return saved.matchedCount?'failed' as const:'lease_lost' as const;};
 let token:string;try{if(!job.encryptedToken)return await finish();token=decryptVerificationToken(job.encryptedToken,this.config.key);}catch{return await finish();}
 const verification=await this.verifications.findOne({_id:job.verificationId,tokenHash:hashToken(token),consumedAt:null,expiresAt:{$gt:new Date()}}).maxTimeMS(1500).lean();if(!verification)return await finish();
 const user=await this.users.findOne({_id:verification.userId,role:'MEMBER',enabled:true,emailVerifiedAt:null}).maxTimeMS(1500).lean();if(!user)return await finish();
 if(!await this.jobs.exists({...fence,leaseExpiresAt:{$gt:new Date(Date.now()+12000)}}).maxTimeMS(1500))return 'lease_lost';
 const text=`Verify your Techy Fellow email using this single-use code: ${token}\nThe code expires one hour after registration. Submit it to the account email-verification flow. This does not subscribe you to marketing emails.`;
 try{await this.provider.send({from:this.config.from,to:[user.email],subject:'Verify your Techy Fellow email',text,html:`<p>${text.replace(/\n/g,'</p><p>')}</p>`},`techyfellow/account-verification/${job.verificationId}/v1`);}
 catch(error){const terminal=job.attempts>=5||(error instanceof EmailProviderError&&!error.retryable);const saved=await this.jobs.updateOne(fence,{$set:{status:terminal?'failed':'pending',nextAttemptAt:new Date(Date.now()+Math.min(900000,60000*2**(job.attempts-1)))},$unset:{leaseToken:1,leaseExpiresAt:1,...(terminal?{encryptedToken:1}:{})}}).maxTimeMS(1500);return !saved.matchedCount?'lease_lost':terminal?'failed':'retry';}
 const saved=await this.jobs.updateOne(fence,{$set:{status:'sent',sentAt:new Date()},$unset:{encryptedToken:1,leaseToken:1,leaseExpiresAt:1}}).maxTimeMS(1500);return saved.matchedCount?'sent':'lease_lost';
 }
}

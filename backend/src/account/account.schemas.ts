import { Schema, type Types } from "mongoose";
export interface VerificationRecord { userId: Types.ObjectId; tokenHash: string; expiresAt: Date; consumedAt?: Date; createdAt: Date }
export interface VerificationJobRecord { verificationId: Types.ObjectId; encryptedToken?: string; status: "pending" | "processing" | "sent" | "failed"; attempts: number; nextAttemptAt: Date; expiresAt: Date; leaseToken?: string; leaseExpiresAt?: Date; sentAt?: Date; createdAt: Date; updatedAt: Date }
const options = { autoCreate: false, autoIndex: false, strict: "throw" as const };
const verification = new Schema<VerificationRecord>({userId:{type:Schema.Types.ObjectId,required:true},tokenHash:{type:String,required:true,select:false,match:/^[a-f0-9]{64}$/},expiresAt:{type:Date,required:true},consumedAt:Date,createdAt:{type:Date,default:Date.now,required:true}},options);
verification.index({tokenHash:1},{unique:true,name:"verification_token_unique"});
verification.index({expiresAt:1},{expireAfterSeconds:0,name:"verification_expiry"});
const job = new Schema<VerificationJobRecord>({verificationId:{type:Schema.Types.ObjectId,required:true},encryptedToken:{type:String,select:false},status:{type:String,enum:["pending","processing","sent","failed"],required:true,default:"pending"},attempts:{type:Number,required:true,default:0,min:0,max:5},nextAttemptAt:{type:Date,required:true},expiresAt:{type:Date,required:true},leaseToken:{type:String,select:false},leaseExpiresAt:Date,sentAt:Date},{...options,timestamps:true});
job.index({verificationId:1},{unique:true,name:"verification_job_unique"});
job.index({status:1,nextAttemptAt:1},{name:"verification_job_due"});
job.index({expiresAt:1},{expireAfterSeconds:0,name:"verification_job_expiry"});
export const accountDefinitions={verification:{name:"AccountVerification",collection:"account_verifications",schema:verification},job:{name:"AccountVerificationJob",collection:"account_verification_jobs",schema:job}};

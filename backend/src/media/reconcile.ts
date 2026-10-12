import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { AppModule } from '../app.module';
import { MediaService } from './media.service';
async function main(){const app=await NestFactory.createApplicationContext(AppModule,{logger:false,abortOnError:false});try{await app.get<Connection>(getConnectionToken()).asPromise();console.log(`Failed upload keys reconciled: ${await app.get(MediaService).reconcile()}`);}finally{await app.close();}}
void main().catch(()=>{console.error('Media reconciliation failed; verify storage/database configuration. No ready assets are deleted.');process.exitCode=1;});

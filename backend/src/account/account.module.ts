import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {AuthModule} from '../auth/auth.module';
import {authDefinitions} from '../auth/auth.schemas';
import {accountDefinitions} from './account.schemas';
import {AccountService} from './account.service';
import {AccountController} from './account.controller';
@Module({imports:[AuthModule,MongooseModule.forFeature([authDefinitions.user,...Object.values(accountDefinitions)])],controllers:[AccountController],providers:[AccountService],exports:[AccountService]})
export class AccountModule{}

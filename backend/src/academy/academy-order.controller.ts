import {Body,Controller,Delete,Get,Header,HttpCode,Param,Post,Req,UseFilters} from '@nestjs/common';
import {Authenticated,PublicEndpoint} from '../auth/permissions';
import type {AuthRequest} from '../auth/auth-http';
import {AcademyService} from './academy.service';
import {AcademyCommerceFilter} from './academy-commerce-errors';
@Controller('academy') @UseFilters(AcademyCommerceFilter)
export class AcademyOrderController {
 constructor(private readonly academy:AcademyService){}
 @Get('courses/:slug/commerce') @PublicEndpoint() @Header('Cache-Control','no-store')
 async commerce(@Param('slug') slug:string){return {data:await this.academy.commerceSummary(slug)};}
 @Get('courses/:slug/order-summary') @Authenticated() @Header('Cache-Control','no-store')
 async summary(@Param('slug') slug:string,@Req() req:AuthRequest){return {data:await this.academy.commerceSummary(slug,req.auth!.user)};}
 @Post('courses/:slug/orders') @Authenticated() @HttpCode(200) @Header('Cache-Control','no-store')
 async create(@Param('slug') slug:string,@Body() body:unknown,@Req() req:AuthRequest){return {data:await this.academy.createOrder(slug,req.auth!.user,body)};}
 @Get('cart') @Authenticated() @Header('Cache-Control','private, no-store')
 async cart(@Req() req:AuthRequest){return {data:await this.academy.getCart(req.auth!.user)};}
 @Post('cart/merge') @Authenticated() @HttpCode(200) @Header('Cache-Control','private, no-store')
 async merge(@Body() body:unknown,@Req() req:AuthRequest){return {data:await this.academy.mergeCart(req.auth!.user,body)};}
 @Delete('cart/items/:slug') @Authenticated() @HttpCode(200) @Header('Cache-Control','private, no-store')
 async remove(@Param('slug') slug:string,@Body() body:unknown,@Req() req:AuthRequest){return {data:await this.academy.removeCartItem(req.auth!.user,slug,body)};}
 @Post('cart/preview') @PublicEndpoint() @HttpCode(200) @Header('Cache-Control','no-store')
 async preview(@Body() body:unknown){return {data:await this.academy.cartQuote(body,undefined,true)};}
 @Post('cart/quote') @Authenticated() @HttpCode(200) @Header('Cache-Control','private, no-store')
 async quote(@Body() body:unknown,@Req() req:AuthRequest){return {data:await this.academy.cartQuote(body,req.auth!.user)};}
 @Post('cart/orders') @Authenticated() @HttpCode(200) @Header('Cache-Control','private, no-store')
 async confirm(@Body() body:unknown,@Req() req:AuthRequest){return {data:await this.academy.createCartOrder(req.auth!.user,body)};}
 @Get('my-learning') @Authenticated() @Header('Cache-Control','private, no-store')
 async learning(@Req() req:AuthRequest){return {data:await this.academy.myLearning(req.auth!.user)};}
 @Get('orders') @Authenticated() @Header('Cache-Control','no-store')
 async list(@Req() req:AuthRequest){return {data:await this.academy.listOrders(req.auth!.user)};}
 @Get('orders/:id') @Authenticated() @Header('Cache-Control','no-store')
 async order(@Param('id') id:string,@Req() req:AuthRequest){return {data:await this.academy.getOrder(id,req.auth!.user)};}
 @Post('orders/:id/cancel') @Authenticated() @HttpCode(200) @Header('Cache-Control','no-store')
 async cancel(@Param('id') id:string,@Body() body:unknown,@Req() req:AuthRequest){return {data:await this.academy.cancelOrder(id,req.auth!.user,body)};}
 @Post('orders/:id/refresh-payment') @Authenticated() @HttpCode(200) @Header('Cache-Control','no-store')
 async refresh(@Param('id') id:string,@Body() body:unknown,@Req() req:AuthRequest){return {data:await this.academy.refreshPayment(id,req.auth!.user,body)};}
}

import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  @Get()
  findAll(@Request() req: any) {
    this.checkAdmin(req);
    return this.usersService.findAll();
  }

  @Get('audit-logs')
  getAuditLogs(@Request() req: any) {
    this.checkAdmin(req);
    return this.usersService.getAuditLogs();
  }

  @Post('audit-logs')
  createAuditLog(@Body() data: any) {
    // Anyone can post an audit log, usually the frontend client does it for actions.
    return this.usersService.createAuditLog(data);
  }

  @Post()
  create(@Request() req: any, @Body() data: any) {
    this.checkAdmin(req);
    return this.usersService.create(data);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    this.checkAdmin(req);
    return this.usersService.update(id, data);
  }

  @Patch(':id/active')
  setActive(@Request() req: any, @Param('id') id: string, @Body('active') active: boolean) {
    this.checkAdmin(req);
    return this.usersService.setActive(id, active);
  }

  @Patch('me/password')
  changeMyPassword(@Request() req: any, @Body() body: any) {
    const userId = req.user?.sub;
    return this.usersService.changeMyPassword(userId, body.oldPassword, body.newPassword);
  }

  @Patch(':id/reset-password')
  resetPassword(@Request() req: any, @Param('id') id: string, @Body('password') password: string) {
    this.checkAdmin(req);
    return this.usersService.resetPassword(id, password);
  }
}

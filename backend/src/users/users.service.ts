import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { isHidden: false },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('البريد الإلكتروني مسجل بالفعل');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
        active: data.active !== undefined ? data.active : true,
      },
    });
    
    const { password, ...result } = user;
    return result;
  }

  async update(id: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        role: data.role,
        ...(data.active !== undefined && { active: data.active }),
      },
    });

    const { password, ...result } = updatedUser;
    return result;
  }

  async setActive(id: string, active: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    return this.prisma.user.update({
      where: { id },
      data: { active },
      select: { id: true, active: true },
    });
  }

  async resetPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true },
    });
  }

  async changeMyPassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new ConflictException('كلمة المرور الحالية غير صحيحة');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true },
    });
  }

  // --- Audit Logs ---
  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 1000, // Limit to last 1000 logs for performance
    });
  }

  async createAuditLog(data: { userRole: string, userName: string, action: string, details: string }) {
    return this.prisma.auditLog.create({
      data: {
        userRole: data.userRole,
        userName: data.userName,
        action: data.action,
        details: data.details,
      },
    });
  }
}

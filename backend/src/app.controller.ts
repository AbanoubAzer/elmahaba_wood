import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Health check and API info' })
  getRoot() {
    return {
      status: 'online',
      message: '🚀 سيرفر نظام شركة المحبة لتجارة الأخشاب يعمل بنجاح',
      apiDocs: '/api/docs',
      apiPrefix: '/api',
      timestamp: new Date().toISOString(),
    };
  }
}

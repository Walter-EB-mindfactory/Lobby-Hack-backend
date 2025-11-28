import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  getTest() {
    return {
      message: 'Backend is working!',
      timestamp: new Date().toISOString(),
      status: 'ok',
    };
  }

  @Post('visit')
  createTestVisit(@Body() body: any) {
    return {
      message: 'Visit received successfully',
      data: body,
      timestamp: new Date().toISOString(),
    };
  }
}

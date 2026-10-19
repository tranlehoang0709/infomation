import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { MediaService, UploadedMediaFile } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get('admin')
  @UseGuards(AuthGuard)
  list(@Req() request: AuthenticatedRequest) {
    return this.media.list(BigInt(request.user.id));
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard)
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.media.delete(BigInt(request.user.id), id);
  }

  @Post('admin/upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  upload(@Req() request: AuthenticatedRequest, @UploadedFile() file?: UploadedMediaFile) {
    if (!file) throw new BadRequestException('Choose a file to upload.');
    return this.media.upload(BigInt(request.user.id), file);
  }

  @Get('admin/:id/file')
  @UseGuards(AuthGuard)
  async getAdminFile(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.media.getAdminFile(BigInt(request.user.id), id);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(file.stream, { type: file.mimeType });
  }

  @Get(':id/file')
  async getPublicFile(@Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    const file = await this.media.getPublicFile(id);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-store');
    if (file.download) response.setHeader('Content-Disposition', 'attachment');
    return new StreamableFile(file.stream, { type: file.mimeType });
  }
}

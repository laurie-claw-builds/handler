import {
  Controller,
  Post,
  Headers,
  Body,
  RawBodyRequest,
  Req,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { GitHubWebhookService, HandleWebhookResult } from './github-webhook.service';

@Controller('api/webhooks/github')
export class GitHubWebhookController {
  constructor(private readonly githubWebhookService: GitHubWebhookService) {}

  @Post()
  @HttpCode(200)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() payload: Record<string, unknown>,
  ): Promise<HandleWebhookResult> {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (secret) {
      // Secret is configured — raw body must be present to verify HMAC
      if (!req.rawBody) {
        throw new BadRequestException('Raw body unavailable; cannot verify webhook signature');
      }
      const valid = this.githubWebhookService.verifySignature(req.rawBody, signature);
      if (!valid) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }
    // If secret is not set: skip verification (dev mode, acceptable)

    if (!event) {
      return { ok: true, skipped: true };
    }

    return this.githubWebhookService.handle(event, payload);
  }
}

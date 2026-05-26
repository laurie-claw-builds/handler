import {
  Controller,
  Post,
  Headers,
  Body,
  RawBodyRequest,
  Req,
  UnauthorizedException,
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
    const rawBody = req.rawBody;

    if (rawBody) {
      const valid = this.githubWebhookService.verifySignature(rawBody, signature);
      if (!valid) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    if (!event) {
      return { ok: true, skipped: true };
    }

    return this.githubWebhookService.handle(event, payload);
  }
}

<?php

namespace App\Jobs;

use App\Models\LandingPage;
use App\Models\LandingPageEvent;
use App\Services\Landing\LandingPageEventService;
use App\Services\Landing\MetaConversionsApiService;
use App\Services\Landing\MetaPixelService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Sends one event to Meta CAPI and records the delivery result.
 * Carries only hashed user data - never the access token; credentials are resolved when the job runs.
 */
class SendMetaConversionEventJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public int $landingPageId,
        public int $eventRowId,
        public array $event,
        public array $tracking,
    ) {}

    public function backoff(): array
    {
        return [15, 90];
    }

    public function handle(MetaPixelService $pixels, MetaConversionsApiService $capi, LandingPageEventService $events): void
    {
        $page = LandingPage::withTrashed()->find($this->landingPageId);
        $row = LandingPageEvent::find($this->eventRowId);
        if (! $page || ! $row) {
            return;
        }

        $config = $pixels->resolve($this->tracking, $page, withSecrets: true);
        $result = $capi->send($config, $this->event);

        $events->recordDelivery($row, 'capi', $result['ok'] ? 'sent' : 'failed', $result['status'], $result['error']);

        // Retry only transient failures (network / 5xx / rate limit); config errors would fail again.
        if (! $result['ok'] && ($result['status'] === null || $result['status'] >= 500 || $result['status'] === 429) && $this->attempts() < $this->tries) {
            $this->release($this->backoff()[$this->attempts() - 1] ?? 60);
        }
    }

    public function failed(\Throwable $e): void
    {
        report($e);
    }
}

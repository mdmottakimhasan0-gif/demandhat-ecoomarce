<?php

namespace App\Services\Landing;

/**
 * Effective Meta configuration for one landing page (page overrides + global + env).
 * Only toPublic() may ever reach the browser; the access token is server-side only.
 */
final class MetaConfig
{
    public function __construct(
        public readonly bool $browserEnabled,
        public readonly ?string $pixelId,
        public readonly array $browserEvents,
        public readonly bool $capiEnabled,
        public readonly ?string $capiPixelId,
        public readonly array $capiEvents,
        public readonly string $apiVersion,
        public readonly ?string $testEventCode,
        private readonly ?string $accessToken = null,
    ) {}

    public function browserAllows(string $event): bool
    {
        return $this->browserEnabled && $this->pixelId && ($this->browserEvents[$event] ?? false);
    }

    public function serverAllows(string $event): bool
    {
        return $this->capiEnabled && $this->capiPixelId && ($this->capiEvents[$event] ?? true);
    }

    public function hasToken(): bool
    {
        return $this->accessToken !== null && $this->accessToken !== '';
    }

    /** Server-side only. */
    public function token(): ?string
    {
        return $this->accessToken;
    }

    /** Browser-safe subset. Deliberately excludes the token and CAPI settings. */
    public function toPublic(): ?array
    {
        if (! $this->browserEnabled || ! $this->pixelId) {
            return null;
        }

        return ['id' => $this->pixelId, 'events' => $this->browserEvents];
    }

    public function withoutSecrets(): self
    {
        return new self($this->browserEnabled, $this->pixelId, $this->browserEvents, $this->capiEnabled, $this->capiPixelId, $this->capiEvents, $this->apiVersion, $this->testEventCode, null);
    }
}

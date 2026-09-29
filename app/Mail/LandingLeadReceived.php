<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class LandingLeadReceived extends Mailable
{
    public function __construct(public string $pageTitle, public string $pageUrl, public array $rows) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'New lead: '.$this->pageTitle);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.landing-lead');
    }
}

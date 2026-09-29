<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;

class BkashPaymentService
{
  private $baseUrl;
  private $username;
  private $password;
  private $appKey;
  private $appSecret;

  public function __construct()
  {
    $this->baseUrl = env('BKASH_BASE_URL');
    $this->username = env('BKASH_CHECKOUT_URL_USER_NAME');
    $this->password = env('BKASH_CHECKOUT_URL_PASSWORD');
    $this->appKey = env('BKASH_CHECKOUT_URL_APP_KEY');
    $this->appSecret = env('BKASH_CHECKOUT_URL_APP_SECRET');
  }

  public function getToken()
  {
    // Return cached token if available to speed up requests
    if (Session::has('bkash_token')) {
      return Session::get('bkash_token');
    }

    $response = Http::withHeaders([
      'username' => $this->username,
      'password' => $this->password,
    ])->post("$this->baseUrl/tokenized/checkout/token/grant", [
          'app_key' => $this->appKey,
          'app_secret' => $this->appSecret,
        ]);

    $data = $response->json();

    if ($response->successful() && isset($data['id_token'])) {
      Session::put('bkash_token', $data['id_token']);
      return $data['id_token'];
    }

    throw new \Exception('bKash Token Generation Failed. Check .env credentials.');
  }

  public function createPayment($orderId, $amount, $callbackUrl)
  {
    $token = $this->getToken();

    $response = Http::withHeaders([
      'Authorization' => $token,
      'X-APP-Key' => $this->appKey,
    ])->post("$this->baseUrl/tokenized/checkout/create", [
          'mode' => '0011',
          'payerReference' => $orderId,
          'callbackURL' => $callbackUrl,
          'amount' => $amount,
          'currency' => 'BDT',
          'intent' => 'sale',
          'merchantInvoiceNumber' => $orderId
        ]);

    return $response->json();
  }

  public function executePayment($paymentID)
  {
    $token = $this->getToken();

    $response = Http::withHeaders([
      'Authorization' => $token,
      'X-APP-Key' => $this->appKey,
    ])->post("$this->baseUrl/tokenized/checkout/execute", [
          'paymentID' => $paymentID
        ]);

    return $response->json();
  }
}
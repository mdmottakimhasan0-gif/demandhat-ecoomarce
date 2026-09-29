<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

function staff(string $role = 'admin', array $attrs = []): User
{
    static $n = 0;
    $n++;

    return User::create($attrs + [
        'name' => "Staff {$n}", 'email' => "staff{$n}@example.com", 'password' => Hash::make('OldPass123'), 'role' => $role,
    ]);
}

it('shows the profile page to staff and redirects guests', function () {
    $this->get('/admin/profile')->assertRedirect('/login');
    $this->actingAs(staff())->get('/admin/profile')->assertOk();
});

it('keeps customers out of the staff profile page', function () {
    $this->actingAs(staff('customer'))->get('/admin/profile')->assertRedirect('/dashboard');
});

it('updates name, email, phone and address', function () {
    $admin = staff();

    $this->actingAs($admin)->put('/admin/profile', [
        'name' => 'New Name', 'email' => 'new@example.com', 'phone' => '01711111111', 'address' => 'Dhaka',
    ])->assertSessionHasNoErrors();

    expect($admin->fresh())->name->toBe('New Name')->email->toBe('new@example.com')->phone->toBe('01711111111');
});

it('rejects an email that belongs to another user', function () {
    $other = staff();

    $this->actingAs(staff())->put('/admin/profile', ['name' => 'X', 'email' => $other->email])->assertSessionHasErrors('email');
});

it('changes the password when the current one is right', function () {
    $admin = staff();

    $this->actingAs($admin)->put('/admin/profile/password', [
        'current_password' => 'OldPass123', 'password' => 'NewPass456', 'password_confirmation' => 'NewPass456',
    ])->assertSessionHasNoErrors();

    expect(Hash::check('NewPass456', $admin->fresh()->password))->toBeTrue();
});

it('refuses a wrong current password, weak or unconfirmed passwords', function () {
    $admin = staff();
    $this->actingAs($admin);

    $this->put('/admin/profile/password', ['current_password' => 'nope', 'password' => 'NewPass456', 'password_confirmation' => 'NewPass456'])
        ->assertSessionHasErrors('current_password');
    $this->put('/admin/profile/password', ['current_password' => 'OldPass123', 'password' => 'short', 'password_confirmation' => 'short'])
        ->assertSessionHasErrors('password');
    $this->put('/admin/profile/password', ['current_password' => 'OldPass123', 'password' => 'NewPass456', 'password_confirmation' => 'Mismatch1'])
        ->assertSessionHasErrors('password');

    expect(Hash::check('OldPass123', $admin->fresh()->password))->toBeTrue();
});

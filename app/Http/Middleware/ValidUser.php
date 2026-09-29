<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class ValidUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!Auth::check()) {
            return redirect('/login');
        }

        $user = Auth::user();

        // 1. PRIMARY CHECK: Does the user have one of the allowed roles?
        // This handles "role:admin,manager,employee" logic perfectly.
        if (in_array($user->role, $roles)) {
            return $next($request);
        }

        // 2. REDIRECTION LOGIC (If the primary check fails)

        // If the user is any kind of Staff (Admin, Manager, Employee)
        // and they tried to access a page they shouldn't (like a Customer page),
        // redirect them to the Admin Dashboard.
        if (in_array($user->role, ['admin', 'manager', 'employee'])) {

            // Optional: If they are already inside /admin but don't have permission
            // (e.g. an Employee trying to access Super Admin Users page),
            // show 403 Forbidden instead of redirecting (to prevent confusion).
            if ($request->is('admin') || $request->is('admin/*')) {
                abort(403, 'You do not have permission to access this page.');
            }

            return redirect('/admin');
        }

        // If the user is a Customer trying to access Admin pages
        if ($user->role === 'customer') {
            return redirect('/dashboard');
        }

        // Final fallback
        abort(403, 'Unauthorized access.');
    }
}
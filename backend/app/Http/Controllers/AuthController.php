<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $username = $request->input('username');
        $password = $request->input('password');

        if (strtolower($username) === 'admin' && $password === 'admin') {
            return response()->json([
                'success' => true,
                'user' => 'Directeur RH',
                'role' => 'admin',
                'email' => 'rh@srm-fm.ma',
                'token' => 'srm-rh-demo-token-12345'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Identifiants de connexion incorrects.'
        ], 401);
    }
}

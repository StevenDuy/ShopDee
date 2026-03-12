<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\SellerFinance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    /**
     * Get finance overview and transaction history
     */
    public function index(Request $request)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $sellerId = $request->user()->id;

        // Calculate Overview Stats
        
        // 1. Total lifetime revenue (completed credits)
        $totalRevenue = SellerFinance::where('seller_id', $sellerId)
            ->where('type', 'credit')
            ->where('status', 'completed')
            ->sum('amount');

        // 2. Pending clearance (pending credits, e.g. orders not yet delivered)
        $pendingClearance = SellerFinance::where('seller_id', $sellerId)
            ->where('type', 'credit')
            ->where('status', 'pending')
            ->sum('amount');

        // 3. Total withdrawn (completed debits)
        $totalWithdrawn = SellerFinance::where('seller_id', $sellerId)
            ->where('type', 'debit')
            ->where('status', 'completed')
            ->sum('amount');

        // 4. Pending withdrawal requests (pending debits)
        $pendingWithdrawal = SellerFinance::where('seller_id', $sellerId)
            ->where('type', 'debit')
            ->where('status', 'pending')
            ->sum('amount');

        // Available to withdraw: Total Revenue - Withdrawn - Pending Withdrawals
        $availableBalance = $totalRevenue - $totalWithdrawn - $pendingWithdrawal;

        // Transaction history
        $transactions = SellerFinance::where('seller_id', $sellerId)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'overview' => [
                'total_revenue' => $totalRevenue,
                'pending_clearance' => $pendingClearance,
                'available_balance' => max(0, $availableBalance),
                'total_withdrawn' => $totalWithdrawn,
                'pending_withdrawal' => $pendingWithdrawal,
            ],
            'transactions' => $transactions
        ]);
    }

    /**
     * Request a withdrawal
     */
    public function withdraw(Request $request)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'amount' => 'required|numeric|min:10',
            'bank_account' => 'required|string',
            'bank_name' => 'required|string',
        ]);

        $sellerId = $request->user()->id;

        // Verify sufficient balance
        $totalRevenue = SellerFinance::where('seller_id', $sellerId)
            ->where('type', 'credit')
            ->where('status', 'completed')
            ->sum('amount');

        $totalWithdrawn = SellerFinance::where('seller_id', $sellerId)
            ->where('type', 'debit')
            ->where('status', 'completed')
            ->sum('amount');

        $pendingWithdrawal = SellerFinance::where('seller_id', $sellerId)
            ->where('type', 'debit')
            ->where('status', 'pending')
            ->sum('amount');

        $availableBalance = $totalRevenue - $totalWithdrawn - $pendingWithdrawal;

        if ($request->amount > $availableBalance) {
            return response()->json([
                'message' => 'Insufficient available balance for withdrawal.',
                'available_balance' => $availableBalance
            ], 400);
        }

        // Create the withdrawal request (pending debit)
        $withdrawal = SellerFinance::create([
            'seller_id' => $sellerId,
            'type' => 'debit',
            'amount' => $request->amount,
            'status' => 'pending',
            'description' => "Withdrawal request to {$request->bank_name} ({$request->bank_account})"
        ]);

        return response()->json([
            'message' => 'Withdrawal request submitted successfully.',
            'withdrawal' => $withdrawal
        ], 201);
    }
}

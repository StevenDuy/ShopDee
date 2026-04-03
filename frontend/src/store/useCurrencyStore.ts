import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CurrencyType = 'VND' | 'USD';

export const EXCHANGE_RATE_USD_TO_VND = 25000;

interface CurrencyState {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  formatPrice: (amount: number) => string;
  compactPrice: (amount: number) => string;
  fromBaseCurrency: (amount: number) => number;
  toBaseCurrency: (amount: number) => number;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'VND',
      setCurrency: (currency) => set({ currency }),
      formatPrice: (amount) => {
        const { currency } = get();
        let finalAmount = amount;
        if (currency === 'USD') {
          finalAmount = amount / EXCHANGE_RATE_USD_TO_VND;
        }

        return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
          style: 'currency',
          currency: currency,
          maximumFractionDigits: currency === 'VND' ? 0 : 2,
        }).format(finalAmount);
      },
      compactPrice: (amount) => {
        const { currency } = get();
        let finalAmount = amount;
        if (currency === 'USD') {
          finalAmount = amount / EXCHANGE_RATE_USD_TO_VND;
        }

        const formatter = new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 1,
        });

        return formatter.format(finalAmount) + " " + currency;
      },
      fromBaseCurrency: (amount) => {
        const { currency } = get();
        if (currency === 'USD') return amount / EXCHANGE_RATE_USD_TO_VND;
        return amount;
      },
      toBaseCurrency: (amount) => {
        const { currency } = get();
        if (currency === 'USD') return amount * EXCHANGE_RATE_USD_TO_VND;
        return amount;
      }
    }),
    {
      name: 'currency-storage',
    }
  )
);

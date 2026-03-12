import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CurrencyType = 'VND' | 'USD';

interface CurrencyState {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  formatPrice: (amount: number) => string;
}

const EXCHANGE_RATE_USD_TO_VND = 25000;

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'VND',
      setCurrency: (currency) => set({ currency }),
      formatPrice: (amount) => {
        const { currency } = get();
        
        let finalAmount = amount;
        
        // Assuming base prices in DB are stored in VND (can be adjusted later)
        if (currency === 'USD') {
          finalAmount = amount / EXCHANGE_RATE_USD_TO_VND;
        }

        return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
          style: 'currency',
          currency: currency,
          maximumFractionDigits: currency === 'VND' ? 0 : 2,
        }).format(finalAmount);
      },
    }),
    {
      name: 'currency-storage',
    }
  )
);

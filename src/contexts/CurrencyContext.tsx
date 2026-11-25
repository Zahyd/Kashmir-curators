import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  flag: string;
  rateFromInr: number;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    label: 'Indian Rupee',
    flag: '🇮🇳',
    rateFromInr: 1,
    locale: 'en-IN',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'US Dollar',
    flag: '🇺🇸',
    rateFromInr: 0.0118,
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'Euro',
    flag: '🇪🇺',
    rateFromInr: 0.0110,
    locale: 'en-IE',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    label: 'British Pound',
    flag: '🇬🇧',
    rateFromInr: 0.0094,
    locale: 'en-GB',
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    label: 'UAE Dirham',
    flag: '🇦🇪',
    rateFromInr: 0.0434,
    locale: 'en-AE',
  },
};

interface CurrencyContextValue {
  currency: CurrencyCode;
  config: CurrencyConfig;
  setCurrency: (code: CurrencyCode) => void;
  convertFromInr: (amountInInr: number) => number;
  formatPrice: (amountInInr: number, options?: { compact?: boolean; decimals?: number }) => string;
}

const STORAGE_KEY = 'kc_preferred_currency';

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
      if (saved && SUPPORTED_CURRENCIES[saved]) {
        return saved;
      }
    } catch {
      // Ignore storage access errors
    }
    return 'INR';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // Ignore storage access errors
    }
  }, [currency]);

  const setCurrency = useCallback((code: CurrencyCode) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyState(code);
    }
  }, []);

  const config = SUPPORTED_CURRENCIES[currency];

  const convertFromInr = useCallback(
    (amountInInr: number) => {
      if (!Number.isFinite(amountInInr)) return 0;
      return amountInInr * config.rateFromInr;
    },
    [config.rateFromInr]
  );

  const formatPrice = useCallback(
    (amountInInr: number, options?: { compact?: boolean; decimals?: number }) => {
      const converted = convertFromInr(amountInInr);
      const decimals =
        options?.decimals !== undefined
          ? options.decimals
          : currency === 'INR'
          ? 0
          : converted < 10
          ? 2
          : 0;

      const formattedNumber = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        notation: options?.compact ? 'compact' : 'standard',
      }).format(decimals === 0 ? Math.round(converted) : converted);

      return `${config.symbol}${formattedNumber}`;
    },
    [config.locale, config.symbol, convertFromInr, currency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        config,
        setCurrency,
        convertFromInr,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}

/**
 * Kashmir Connect CRM - Dependency-Free Environment Variable Validator
 * Validates process.env parameters on startup and provides strict typing
 */

export interface EnvSchema {
  PORT: number;
  DATABASE_URL: string;
  GOOGLE_SPREADSHEET_ID: string;
  GOOGLE_CREDS_JSON?: string;
  GOOGLE_CLIENT_ID?: string;
  GMAIL_USER?: string;
  GMAIL_PASS?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_VERIFY_TOKEN: string;
  OTP_DELIVERY_METHOD?: string;
  TWILIO_WHATSAPP_NUMBER?: string;
}

export function validateEnv(): EnvSchema {
  const errors: string[] = [];

  const getEnvString = (key: string, defaultValue?: string, required = true): string => {
    const val = process.env[key] !== undefined ? process.env[key] : defaultValue;
    if (required && (val === undefined || val === '')) {
      errors.push(`Missing required environment variable: ${key}`);
    }
    return val || '';
  };

  const getEnvNumber = (key: string, defaultValue: number): number => {
    const val = process.env[key];
    if (val === undefined || val === '') return defaultValue;
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      errors.push(`Environment variable ${key} must be a valid integer.`);
      return defaultValue;
    }
    return num;
  };

  // Validate parameters
  const config: EnvSchema = {
    PORT: getEnvNumber('PORT', 5000),
    DATABASE_URL: getEnvString('DATABASE_URL'),
    GOOGLE_SPREADSHEET_ID: getEnvString('GOOGLE_SPREADSHEET_ID', '', false),
    GOOGLE_CREDS_JSON: getEnvString('GOOGLE_CREDS_JSON', '', false),
    GOOGLE_CLIENT_ID: getEnvString('GOOGLE_CLIENT_ID', '', false),
    GMAIL_USER: getEnvString('GMAIL_USER', '', false),
    GMAIL_PASS: getEnvString('GMAIL_PASS', '', false),
    WHATSAPP_ACCESS_TOKEN: getEnvString('WHATSAPP_ACCESS_TOKEN', '', false),
    WHATSAPP_PHONE_NUMBER_ID: getEnvString('WHATSAPP_PHONE_NUMBER_ID', '', false),
    WHATSAPP_VERIFY_TOKEN: getEnvString('WHATSAPP_VERIFY_TOKEN', 'kashmir_connect_verify_token'),
    OTP_DELIVERY_METHOD: getEnvString('OTP_DELIVERY_METHOD', 'META_WHATSAPP', false),
    TWILIO_WHATSAPP_NUMBER: getEnvString('TWILIO_WHATSAPP_NUMBER', '+14155238886', false),
  };

  if (errors.length > 0) {
    console.error('\n❌ ======================================================');
    console.error('🏔️  KASHMIR CONNECT - CRITICAL CONFIGURATION FAULT(S):');
    console.error('======================================================');
    errors.forEach(err => console.error(`  - ${err}`));
    console.error('======================================================');
    console.error('Please configure your server/.env file, then restart.');
    console.error('======================================================\n');
    process.exit(1);
  }

  return config;
}

export const env = validateEnv();
export default env;

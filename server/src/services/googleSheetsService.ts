import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

class GoogleSheetsService {
  private sheets: any = null;

  private async getSheetsClient() {
    if (this.sheets) return this.sheets;

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID is not configured in environment variables.');
    }

    let auth: any = null;
    const credsJsonEnv = process.env.GOOGLE_CREDS_JSON;
    const credsFilePath = path.join(__dirname, '../../google-credentials.json');

    if (credsJsonEnv) {
      console.log('[GoogleSheetsService] Authenticating via GOOGLE_CREDS_JSON environment variable.');
      try {
        const credentials = JSON.parse(credsJsonEnv);
        auth = new google.auth.JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
      } catch (err: any) {
        throw new Error(`Failed to parse GOOGLE_CREDS_JSON env variable: ${err.message}`);
      }
    } else if (fs.existsSync(credsFilePath)) {
      console.log('[GoogleSheetsService] Authenticating via google-credentials.json file.');
      try {
        const credentials = JSON.parse(fs.readFileSync(credsFilePath, 'utf8'));
        auth = new google.auth.JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
      } catch (err: any) {
        throw new Error(`Failed to read/parse google-credentials.json file: ${err.message}`);
      }
    } else {
      throw new Error('Google credentials not found. Set GOOGLE_CREDS_JSON or create google-credentials.json.');
    }

    this.sheets = google.sheets({ version: 'v4', auth });
    return this.sheets;
  }

  public async appendLeadToSheet(inquiry: any) {
    try {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      if (!spreadsheetId) {
        console.warn('[GoogleSheetsService] Ingestion skipped: GOOGLE_SPREADSHEET_ID is missing.');
        return false;
      }

      const client = await this.getSheetsClient();

      // Check if sheet has headers by getting the first row
      let hasHeaders = false;
      try {
        const response = await client.spreadsheets.values.get({
          spreadsheetId,
          range: 'Sheet1!A1:K1',
        });
        hasHeaders = !!(response.data.values && response.data.values.length > 0);
      } catch (err: any) {
        console.warn(`[GoogleSheetsService] Could not check sheet headers: ${err.message}. Attempting header initialization.`);
      }

      const headers = [
        'Date Submitted',
        'Inquiry ID',
        'Customer Name',
        'Email',
        'Phone',
        'Destination',
        'Duration',
        'Travelers',
        'Budget',
        'Accommodation Preference',
        'Status'
      ];

      if (!hasHeaders) {
        console.log('[GoogleSheetsService] Sheet appears to be empty. Dynamically writing header row...');
        await client.spreadsheets.values.append({
          spreadsheetId,
          range: 'Sheet1!A1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers]
          }
        });
      }

      // Format date nicely
      const dateStr = inquiry.createdAt 
        ? new Date(inquiry.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      const rowValues = [
        dateStr,
        inquiry.id || '',
        inquiry.customerName || '',
        inquiry.email || '',
        inquiry.phone || '',
        inquiry.destination || '',
        inquiry.duration || '',
        inquiry.travelers || '',
        inquiry.budget || '',
        inquiry.accommodation || '',
        inquiry.status || 'New'
      ];

      console.log(`[GoogleSheetsService] Appending new lead row for customer: ${inquiry.customerName}`);
      await client.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:K',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowValues]
        }
      });

      console.log('[GoogleSheetsService] Ingestion successful.');
      return true;
    } catch (error: any) {
      console.error('[GoogleSheetsService] Ingestion failed gracefully:', error.message);
      return false;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();

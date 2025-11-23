# SMS Authentication Setup Guide

Your app already has SMS OTP login implemented! To enable SMS sending, you need to configure Supabase with an SMS provider.

## Step 1: Choose an SMS Provider

Supabase supports several SMS providers:
- **Twilio** (Recommended - most reliable)
- **Vonage** (formerly Nexmo)
- **MessageBird**
- **Textlocal**

## Step 2: Set Up Twilio (Recommended)

### 2.1 Create a Twilio Account
1. Go to [Twilio.com](https://www.twilio.com) and sign up
2. Verify your account and phone number
3. Get a trial phone number (or purchase one)

### 2.2 Get Twilio Credentials
1. Go to Twilio Console → Account → API Keys & Tokens
2. Note your:
   - **Account SID** (starts with `AC...`)
   - **Auth Token**
   - **Phone Number** (your Twilio number, format: +1234567890)

### 2.3 Configure Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Phone**
3. Enable **Phone** provider
4. Under **SMS Provider**, select **Twilio**
5. Enter your Twilio credentials:
   - **Account SID**: Your Twilio Account SID
   - **Auth Token**: Your Twilio Auth Token
   - **From Phone Number**: Your Twilio phone number (E.164 format: +1234567890)

### 2.4 Configure SMS Template (Optional)
1. In Supabase Dashboard → **Authentication** → **Templates**
2. Customize the SMS template for OTP codes
3. Default template uses `{{ .Token }}` for the 6-digit code

## Step 3: Test SMS Authentication

1. Go to your app's login page
2. Click the **SMS Code** tab
3. Enter a phone number (format: +1234567890 or just 1234567890)
4. Click **Send Code**
5. Check your phone for the 6-digit code
6. Enter the code to verify

## Step 4: Phone Number Format

The app automatically formats US numbers:
- User enters: `(555) 123-4567` or `5551234567`
- App formats to: `+15551234567`

For international numbers, users should include country code:
- `+44 20 1234 5678` (UK)
- `+33 1 23 45 67 89` (France)

## Troubleshooting

### SMS Not Sending
1. Check Twilio account has credits
2. Verify phone number format is correct (E.164)
3. Check Supabase logs: Dashboard → Logs → Auth Logs
4. Verify Twilio credentials are correct

### Invalid Code Error
1. Codes expire after 60 seconds (default)
2. Make sure you're entering the code from the most recent SMS
3. Check that phone number matches exactly

### Rate Limiting
- Supabase limits SMS sends to prevent abuse
- Default: 5 SMS per phone number per hour
- Can be adjusted in Supabase Dashboard → Authentication → Rate Limits

## Cost Considerations

- **Twilio Trial**: Free credits for testing
- **Twilio Production**: ~$0.0075 per SMS in US
- Consider implementing rate limiting to control costs

## Security Best Practices

1. ✅ Codes expire after 60 seconds (already configured)
2. ✅ Rate limiting prevents abuse (Supabase default)
3. ✅ Phone numbers are verified before account creation
4. ✅ Consider adding CAPTCHA for production

## Alternative: Use Supabase's Built-in SMS (Limited)

Supabase has a built-in SMS service but it's limited:
- Only works for certain countries
- Requires manual approval
- Not recommended for production

For production, use Twilio or another provider.


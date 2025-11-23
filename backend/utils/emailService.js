import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter
const createTransporter = () => {
  // Check if email configuration exists
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = process.env.EMAIL_PORT || 587;
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.warn('⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env file.');
    return null;
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort == 465, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPassword
    },
    tls: {
      rejectUnauthorized: false // For development only
    }
  });
};

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email address
 * @param {string} name - Faculty name
 * @param {string} otp - One-time password
 * @returns {Promise<void>}
 */
export const sendOTPEmail = async (email, name, otp) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    throw new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file.');
  }

  const mailOptions = {
    from: `"Student Late Tracking System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset OTP - Student Late Tracking System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #4CAF50;
          }
          .header h1 {
            color: #4CAF50;
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px 0;
          }
          .otp-box {
            background: #f5f5f5;
            border: 2px dashed #4CAF50;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 5px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
          }
          .btn {
            display: inline-block;
            padding: 12px 30px;
            background: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Student Late Tracking System</h1>
            <p>Password Reset Request</p>
          </div>
          
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            
            <p>We received a request to reset your password. Use the OTP below to complete the password reset process:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Your One-Time Password</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Valid for 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>This OTP is valid for <strong>10 minutes</strong> only</li>
                <li>Do not share this OTP with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password will remain unchanged if you don't use this OTP</li>
              </ul>
            </div>
            
            <p><strong>How to use this OTP:</strong></p>
            <ol>
              <li>Go back to the password reset page</li>
              <li>Enter this OTP code</li>
              <li>Create your new password</li>
              <li>Login with your new credentials</li>
            </ol>
          </div>
          
          <div class="footer">
            <p>This is an automated email from the Student Late Tracking System.</p>
            <p>If you have any questions or concerns, please contact the system administrator.</p>
            <p style="margin-top: 20px; color: #999;">© 2025 Student Late Tracking System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${name},

We received a request to reset your password for the Student Late Tracking System.

Your One-Time Password (OTP): ${otp}

This OTP is valid for 10 minutes only.

How to use this OTP:
1. Go back to the password reset page
2. Enter this OTP code: ${otp}
3. Create your new password
4. Login with your new credentials

Security Notice:
- Do not share this OTP with anyone
- If you didn't request this, please ignore this email
- Your password will remain unchanged if you don't use this OTP

This is an automated email from the Student Late Tracking System.
If you have any questions, please contact the system administrator.

© 2025 Student Late Tracking System
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Verify email configuration
 * @returns {Promise<boolean>}
 */
export const verifyEmailConfig = async () => {
  const transporter = createTransporter();
  
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Email service is configured and ready');
    return true;
  } catch (error) {
    console.error('❌ Email service verification failed:', error.message);
    return false;
  }
};

export default {
  sendOTPEmail,
  verifyEmailConfig
};

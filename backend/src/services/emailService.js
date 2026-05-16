const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM_NAME = process.env.EMAIL_FROM_NAME || 'منصة معادلات الهندسة';
const FROM_ADDRESS = process.env.GMAIL_USER;

/**
 * إرسال إيميل تأكيد قبول الطالب
 */
const sendApprovalEmail = async (email, fullName) => {
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
    to: email,
    subject: '🎉 تم قبول طلبك في منصة معادلات الهندسة',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1a1f3c, #2d3561); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .body { padding: 40px; }
          .body h2 { color: #1a1f3c; }
          .body p { color: #555; line-height: 1.8; }
          .btn { display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 منصة معادلات الهندسة</h1>
          </div>
          <div class="body">
            <h2>مرحباً ${fullName}!</h2>
            <p>نسعد بإبلاغك أنه تمت مراجعة بياناتك بنجاح، وتم <strong>قبول طلبك</strong> في منصة معادلات الهندسة.</p>
            <p>يمكنك الآن تسجيل الدخول والاستفادة من جميع محتويات المنصة.</p>
            <a href="${process.env.FRONTEND_URL}/login" class="btn">تسجيل الدخول الآن</a>
            <p style="color: #888; font-size: 14px;">إذا كان لديك أي استفسار، تواصل معنا على: ${process.env.SUPPORT_EMAIL || process.env.GMAIL_USER}</p>
          </div>
          <div class="footer">
            <p>منصة معادلات الهندسة &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

/**
 * إرسال إيميل رفض الطالب
 */
const sendRejectionEmail = async (email, fullName) => {
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
    to: email,
    subject: 'منصة معادلات الهندسة - تحديث حالة طلبك',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1a1f3c, #2d3561); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .body { padding: 40px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 منصة معادلات الهندسة</h1>
          </div>
          <div class="body">
            <h2>مرحباً ${fullName}</h2>
            <p>نأسف لإبلاغك أنه تعذر قبول طلبك في الوقت الحالي.</p>
            <p>يُرجى التواصل مع الدعم للمزيد من المعلومات:</p>
            <p>📞 ${process.env.SUPPORT_PHONE || ''}</p>
            <p>✉️ ${process.env.SUPPORT_EMAIL || process.env.GMAIL_USER}</p>
          </div>
          <div class="footer">
            <p>منصة معادلات الهندسة &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

/**
 * إرسال إيميل إعادة تعيين كلمة السر
 */
const sendPasswordResetEmail = async (email, fullName, resetUrl) => {
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
    to: email,
    subject: 'منصة معادلات الهندسة - إعادة تعيين كلمة السر',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1a1f3c, #2d3561); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .body { padding: 40px; }
          .btn { display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 8px; margin-top: 20px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 إعادة تعيين كلمة السر</h1>
          </div>
          <div class="body">
            <h2>مرحباً ${fullName}</h2>
            <p>تلقينا طلباً لإعادة تعيين كلمة السر الخاصة بحسابك.</p>
            <p>اضغط على الزر أدناه لإعادة تعيين كلمة السر:</p>
            <a href="${resetUrl}" class="btn">إعادة تعيين كلمة السر</a>
            <div class="warning">
              ⚠️ هذا الرابط صالح لمدة <strong>30 دقيقة</strong> فقط.
              إذا لم تطلب ذلك، تجاهل هذا الإيميل.
            </div>
          </div>
          <div class="footer">
            <p>منصة معادلات الهندسة &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

/**
 * إرسال كلمة السر المؤقتة الجديدة
 */
const sendTempPasswordEmail = async (email, fullName, tempPassword) => {
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
    to: email,
    subject: 'منصة معادلات الهندسة - كلمة السر المؤقتة',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1a1f3c, #2d3561); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .body { padding: 40px; }
          .password-box { background: #f0f4ff; border: 2px dashed #4f46e5; padding: 20px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 كلمة السر الجديدة</h1>
          </div>
          <div class="body">
            <h2>مرحباً ${fullName}</h2>
            <p>تم إعادة تعيين كلمة السر الخاصة بك. كلمة السر المؤقتة:</p>
            <div class="password-box">${tempPassword}</div>
            <p>⚠️ يُرجى تغيير كلمة السر فور تسجيل الدخول.</p>
          </div>
          <div class="footer">
            <p>منصة معادلات الهندسة &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
  sendPasswordResetEmail,
  sendTempPasswordEmail,
};

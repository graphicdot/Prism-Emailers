import { Template } from './types';

const MOCK_HTML_1 = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
        <img src="https://picsum.photos/200/50" alt="Prism Logo" style="max-width: 200px;">
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 20px; background-color: #ffffff;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto;" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="text-align: center;">
              <h1 style="color: #333333; font-size: 24px; margin-bottom: 20px;">Welcome to Prism AI!</h1>
              <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                We are thrilled to have you on board. Explore the future of email marketing with our cutting-edge AI tools.
              </p>
              <a href="#" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Get Started</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; color: #999999; font-size: 12px;">
        <p>&copy; 2024 Prism AI Inc. All rights reserved.</p>
        <p>123 Innovation Dr, Tech City, TC 90210</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const MOCK_HTML_2 = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Helvetica, sans-serif; background-color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding: 0;">
        <img src="https://picsum.photos/600/200" alt="Newsletter Banner" style="width: 100%; max-width: 600px; display: block; margin: 0 auto;">
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #ffffff; max-width: 600px; margin: 0 auto; display: block;">
        <h2 style="color: #1e293b; font-size: 22px; margin-top: 0;">Monthly Insights</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          This month we dive deep into the trends shaping our industry. From generative AI to sustainable tech, here is what you need to know.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <h3 style="color: #334155; font-size: 18px;">Feature Spotlight</h3>
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td width="30%" valign="top">
                    <img src="https://picsum.photos/100/100" alt="Feature Icon" style="border-radius: 8px;">
                </td>
                <td width="70%" valign="top" style="padding-left: 15px;">
                    <p style="margin-top: 0; color: #475569;"><strong>Smart Automation:</strong> Save time with our new workflow builder.</p>
                    <a href="https://example.com" style="color: #2563eb; text-decoration: underline;">Learn more &rarr;</a>
                </td>
            </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #1e293b; color: #ffffff;">
        <p style="margin: 0; font-size: 14px;">Prism Newsletter</p>
        <a href="#" style="color: #94a3b8; font-size: 12px; margin-top: 10px; display: inline-block;">Unsubscribe</a>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const MOCK_HTML_3 = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; background-color: #fffbeb;">
  <div style="max-width: 500px; margin: 40px auto; border: 2px dashed #d97706; padding: 20px; text-align: center; background-color: #ffffff;">
    <h1 style="color: #b45309; font-size: 28px;">Flash Sale!</h1>
    <p style="font-size: 18px; color: #78350f;">24 Hours Only</p>
    <div style="margin: 20px 0;">
        <img src="https://picsum.photos/400/300" alt="Product Showcase" style="max-width: 100%; border: 1px solid #fcd34d;">
    </div>
    <p style="font-size: 16px; color: #92400e; margin-bottom: 20px;">
        Don't miss out on up to 50% off selected items. Use code <strong>PRISM50</strong> at checkout.
    </p>
    <a href="#" style="background-color: #d97706; color: white; padding: 15px 30px; text-decoration: none; font-size: 18px; display: inline-block;">Shop Now</a>
  </div>
</body>
</html>
`;

export const DEFAULT_TEMPLATES: Template[] = [
  { id: '1', name: 'Welcome Email', content: MOCK_HTML_1 },
  { id: '2', name: 'Monthly Newsletter', content: MOCK_HTML_2 },
  { id: '3', name: 'Flash Sale', content: MOCK_HTML_3 },
];

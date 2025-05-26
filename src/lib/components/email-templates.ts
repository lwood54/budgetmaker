export const generateEmailHtml = ({
  buttonTitle,
  expireInHours,
  firstName,
  requestLinkUrl,
  requestTo,
  title,
}: {
  buttonTitle: string;
  expireInHours: number;
  firstName?: string | null;
  requestTo: string;
  requestLinkUrl: string;
  title: string;
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #14b8a6 70%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${title}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
        ${firstName ? `<p>Hi ${firstName},</p>` : '<p>Hi there,</p>'}
        
        <p>We received a request to ${requestTo} for your BudgetMaker account. If you made this request, click the button below to ${requestTo}:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${requestLinkUrl}" 
             style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 30%, #1e293b 70%, #0f172a 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold; 
                    display: inline-block;
                    font-size: 16px;">
            ${buttonTitle}
          </a>
        </div>
        
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          ${requestLinkUrl}
        </p>
        
        <p><strong>This link will expire in ${expireInHours} hour${expireInHours > 1 ? 's' : ''}.</strong></p>
        
        <p>If you didn't request this, you can safely ignore this email. Nothing will be changed.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          Best regards,<br>
          The BudgetMaker Team
        </p>
      </div>
    </body>
    </html>
  `;
};

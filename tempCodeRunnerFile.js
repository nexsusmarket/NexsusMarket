
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Professional email template to be sent to the support inbox
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">New Customer Support Ticket</h1>
                </div>
                <div style="padding: 20px;">
                    <h2 style="color: #4f46e5; border-bottom: 2px solid #eee; padding-bottom: 10px;">User Information</h2>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Phone:</strong> ${user.phone}</p>
                    <p><em>(Click 'Reply' to respond directly to this user)</em></p>
                    
                    <h2 style="color: #4f46e5; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px;">Issue Details</h2>
                    <p><strong>Category:</strong> ${category}</p>
                    <p><strong>Message:</strong></p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border: 1px solid #eee;">
                        <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                    </div>
                </div>
                <div style="background-color: #f4f4f4; color: #777; padding: 15px; text-align: center; font-size: 12px;">
                    <p>This is an automated message from the NexusMarket system.</p>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"NexusMarket System" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send TO the support email
            replyTo: user.email, // Set Reply-To to the user's email
            subject: `[Support Ticket] - ${category} from ${user.name}`,
            html: emailHtml
        });
        
        console.log(`✅ Support ticket from ${user.email} has been logged in the support inbox.`);
        res.status(200).json({ message: 'Your message has been sent successfully!' });

    } catch (error) {
        console.error("Error sending support ticket:", error);
        res.status(5.00).json({ message: 'A server error occurred. Please try again later.' });
    }
});


// server.js

// --- 1. IMPORTS (MUST BE AT THE VERY TOP) ---
require('dotenv').config();
const express = require('express'); // <--- THIS MUST BE HERE
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// --- 2. INITIALIZE APP (MUST BE AFTER IMPORTS) ---
const app = express(); // <--- Now this works because express is imported above!

// --- 3. MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- 4. CONFIGURATION ---
const PORT = process.env.PORT || 3000;

// ... (Keep the rest of your code below this line) ...
// 🧠 INTELLIGENT CONFIGURATION FOR EMAIL LINKS
// If you are deploying, set 'FRONTEND_URL' in your Cloud Environment Variables.
// If you are developing locally, you don't need to set it; it defaults to VS Code Live Server.
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';

console.log(`📧 Email Links will point to: ${FRONTEND_URL}`);

const otpStore = {}; // In-memory store for signup OTPs



// --- 3. MONGODB CONNECTION SETUP ---
const uri = process.env.MONGO_URI;
let usersCollection;
const client = new MongoClient(uri);

// --- NODEMAILER TRANSPORTER ---
// --- NODEMAILER TRANSPORTER ---
// --- NODEMAILER TRANSPORTER ---
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // Reads 'smtp.gmail.com' from .env
    port: process.env.EMAIL_PORT, // Reads '465' from .env
    secure: true,                 // ⚠️ MUST be true for Port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// --- HELPER FUNCTIONS ---

// Function to run the Python Recommender Script
function runRecommender(phone) {
    console.log(`🧠 Triggering recommendation engine for user (phone): ${phone}`);
    console.time(`recommender-execution-${phone}`);

    const productFilePath = path.join(__dirname, 'products.json');
    const scriptPath = path.join(__dirname, 'recommender.py');

    if (!fs.existsSync(productFilePath)) {
        console.error("❌ products.json is missing. Cannot run recommender.");
        console.timeEnd(`recommender-execution-${phone}`);
        return;
    }

    const mongoUri = process.env.MONGO_URI;

    // ⭐ FIX: Smart Python Command
    // Use 'python3' for Linux/Cloud/Mac, 'python' for Windows
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

    // Arguments: [script path, phone number, json file path, mongo connection string]
    const pythonProcess = spawn(pythonCommand, [scriptPath, phone, productFilePath, mongoUri]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python Script Output]: ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python Script Error]: ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
        console.timeEnd(`recommender-execution-${phone}`);
        if (code !== 0) {
            console.error(`Python script for user ${phone} exited with code ${code}`);
        } else {
            console.log(`✅ Recommendations updated successfully in Atlas for ${phone}`);
        }
    });
}

// Function to Calculate Points based on History
function calculatePointsFromHistory(deliveredItems) {
    if (!deliveredItems || deliveredItems.length === 0) return 0;
    
    let totalPoints = 0;
    
    deliveredItems.forEach(item => {
        // Use pricePaid if available (discounted), else regular price
        const finalPrice = item.pricePaid !== undefined ? item.pricePaid : item.price;
        const quantity = item.quantity || 1;
        let pointsPerItem = 0;

        // ⭐ TIERED LOGIC ⭐
        if (finalPrice > 100000) {
            pointsPerItem = 50;
        } else if (finalPrice > 50000) {
            pointsPerItem = 40;
        } else if (finalPrice > 25000) {
            pointsPerItem = 25;
        } else if (finalPrice > 10000) {
            pointsPerItem = 15;
        } else if (finalPrice > 5000) {
            pointsPerItem = 5;
        } else {
            pointsPerItem = 2; // Less than or equal to 5000
        }

        totalPoints += (pointsPerItem * quantity);
    });
    
    return totalPoints;
}

// --- ORDER STATUS UPDATE AND EMAIL LOGIC ---
async function processOrderStatusUpdates(user) {
    const today = new Date();
    let requiresDbUpdate = false;
    const itemsToAddToDelivered = [];
    
    // Ensure points exist
    if (typeof user.rewardPoints !== 'number') user.rewardPoints = 0;
    if (!user.orders || user.orders.length === 0) return { user, requiresDbUpdate: false };

    for (const order of user.orders) {
        // Skip completed orders
        if (order.status === 'Delivered' || order.status === 'Cancelled') continue;

        // --- 1. Date Calculations ---
        const orderDate = new Date(order.orderDate);
        const shippedDate = new Date(order.shippedDate);
        const deliveryDate = new Date(order.estimatedDelivery); 

        // Normalize dates to Midnight for accurate Day comparison
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const deliveryDayDateOnly = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
        const shippedDayDateOnly = new Date(shippedDate.getFullYear(), shippedDate.getMonth(), shippedDate.getDate());

        let originalStatus = order.status;

        // --- 2. Status Transition Logic ---

        // A. Check for "Delivered" (Simulated at 1:30 PM on Delivery Day)
        if (todayDateOnly >= deliveryDayDateOnly && today.getHours() >= 13 && today.getMinutes() >= 30) { 
            order.status = 'Delivered';
        } 
        // B. Check for "Out for Delivery" (Trigger at 8:00 AM on Delivery Day)
        else if (todayDateOnly >= deliveryDayDateOnly && today.getHours() >= 8) { 
            order.status = 'Out for Delivery';
        } 
        // C. Check for "Shipped"
        else if (todayDateOnly >= shippedDayDateOnly) { 
            order.status = 'Shipped';
        }

        if (order.status !== originalStatus) requiresDbUpdate = true;

        // --- 3. Email Notification Logic ---

        // ➤ LOGIC 1: OUT FOR DELIVERY (Send OTP at 8 AM)
        if (order.status === 'Out for Delivery' && !order.outForDeliveryEmailSent) {
            order.outForDeliveryEmailSent = true;
            // Generate OTP if not exists
            if (!order.deliveryOTP) {
                order.deliveryOTP = Math.floor(100000 + Math.random() * 900000).toString();
            }
            requiresDbUpdate = true;
            
            // Professional OTP Email Template
            const otpEmailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Out for Delivery</h1>
                </div>
                <div style="padding: 30px 20px; color: #374151;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Hello ${user.name},</p>
                    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                        Your package for order <strong>#${order.orderId}</strong> has arrived at your local hub and is out for delivery today.
                    </p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Your Delivery OTP</p>
                        <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #111827; letter-spacing: 5px;">${order.deliveryOTP}</p>
                    </div>

                    <p style="font-size: 14px; color: #6b7280;">Please share this code with the delivery agent only when you receive the package.</p>
                </div>
                <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">NexusMarket Logistics Team</p>
                </div>
            </div>`;

            try {
                await transporter.sendMail({
                    from: `"NexusMarket Logistics" <${process.env.EMAIL_USER}>`,
                    to: order.confirmationEmail,
                    subject: `Out for Delivery: Order #${order.orderId} (OTP Inside)`,
                    html: otpEmailHtml
                });
                console.log(`📧 OTP Email sent for Order #${order.orderId} at ${new Date().toLocaleTimeString()}`);
            } catch (e) { console.error("Error sending OTP email:", e); }
        }

        // ➤ LOGIC 2: DELIVERED (Send Success Email - NO POINTS SHOWN)
        if (order.status === 'Delivered' && !order.deliveryConfirmationEmailSent) {
            const deliveryTimestamp = new Date().toISOString();
            order.deliveryConfirmationEmailSent = true;
            order.actualDeliveryDate = deliveryTimestamp;
            requiresDbUpdate = true;

            // Calculate points internally (for DB only)
            let pointsEarnedThisOrder = 0;

            const deliveredItemsWithDate = order.items.map(item => {
                const finalPrice = item.pricePaid !== undefined ? item.pricePaid : item.price;
                const quantity = item.quantity || 1;
                let pointsPerItem = 0;

                // Tiered Logic
                if (finalPrice > 100000) pointsPerItem = 50;
                else if (finalPrice > 50000) pointsPerItem = 40;
                else if (finalPrice > 25000) pointsPerItem = 25;
                else if (finalPrice > 10000) pointsPerItem = 15;
                else if (finalPrice > 5000) pointsPerItem = 5;
                else pointsPerItem = 2;

                pointsEarnedThisOrder += (pointsPerItem * quantity);

                return {
                    ...item,
                    orderId: order.orderId,
                    deliveryDate: deliveryTimestamp,
                    category: item.category || 'Unknown',
                    reviewed: false,
                    _id: new ObjectId()
                };
            });

            // Update user points silently in DB
            if (pointsEarnedThisOrder > 0) {
                user.rewardPoints += pointsEarnedThisOrder;
            }

            // Move items to History
            itemsToAddToDelivered.push(...deliveredItemsWithDate);

            // Professional Delivery Success Email Template
            // 🧠 USES INTELLIGENT FRONTEND_URL
            const successEmailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #10b981; padding: 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Package Delivered</h1>
                </div>
                <div style="padding: 30px 20px; color: #374151; text-align: center;">
                    <div style="font-size: 48px; color: #10b981; margin-bottom: 10px;">
                        &#10004;
                    </div>
                    <p style="font-size: 18px; font-weight: 600; margin-bottom: 20px;">Your order has been delivered successfully!</p>
                    
                    <p style="font-size: 15px; color: #6b7280; margin-bottom: 30px;">
                        Order <strong>#${order.orderId}</strong> was handed over on ${new Date().toLocaleDateString('en-IN', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}.
                    </p>
                    
                    <div style="text-align: left; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px; text-transform: uppercase; color: #9ca3af;">What's Next?</p>
                        <p style="margin: 0 0 5px 0; font-size: 14px;">&bull; View your invoice in the 'Delivered' section.</p>
                        <p style="margin: 0; font-size: 14px;">&bull; Leave a review to help other customers.</p>
                    </div>

                    <a href="${FRONTEND_URL}/delivered.html" style="display: inline-block; margin-top: 30px; background-color: #1f2937; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: 500;">View Order Details</a>
                </div>
                <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">Thank you for shopping with NexusMarket.</p>
                </div>
            </div>`;

            try {
                await transporter.sendMail({
                    from: `"NexusMarket" <${process.env.EMAIL_USER}>`,
                    to: order.confirmationEmail,
                    subject: `Delivered: Your Order #${order.orderId} has arrived`,
                    html: successEmailHtml
                });
                console.log(`📧 Success Email sent for Order #${order.orderId}`);
            } catch (e) { console.error("Error sending Success email:", e); }
        }
    }

    // Save history to DB
    if (itemsToAddToDelivered.length > 0) {
        if (!user.deliveredItems) user.deliveredItems = [];
        user.deliveredItems.unshift(...itemsToAddToDelivered);
        requiresDbUpdate = true;
    }

    return { user, requiresDbUpdate };
}

// --- Scheduled Tasks ---
function startScheduledTasks() {
    cron.schedule('*/30 * * * *', async () => {
        console.log('-------------------------------------------');
        console.log('🕒 Running scheduled task: Checking all active orders...');
        try {
            const usersWithActiveOrders = await usersCollection.find({ "orders.status": { $nin: ["Delivered", "Cancelled"] } }).toArray();

            for (const user of usersWithActiveOrders) {
                const { user: updatedUser, requiresDbUpdate } = await processOrderStatusUpdates(user);
                
                if (requiresDbUpdate) {
                    await usersCollection.updateOne(
                        { _id: user._id }, 
                        { $set: { 
                            orders: updatedUser.orders,
                            deliveredItems: updatedUser.deliveredItems 
                        }}
                    );
                    console.log(`   -> Background status updated for user: ${user.email}`);
                }
            }
        } catch (error) {
            console.error("❌ Error during scheduled task:", error);
        }
    }, { scheduled: true, timezone: "Asia/Kolkata" });
}

async function connectToDbAndStartServer() {
    try {
        await client.connect();
        const database = client.db("nexusMarketDB");
        usersCollection = database.collection("users");
        console.log("✅ Successfully connected to MongoDB Atlas.");

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on Port ${PORT}`);
        });
        
        startScheduledTasks();
    } catch (error) {
        console.error("❌ Could not connect to MongoDB", error);
        process.exit(1);
    }
}


// --- 4. API ROUTES (ENDPOINTS) ---

// --- Authentication Routes ---

app.post('/signup/send-otp', async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        if (!name || !phone || !email) {
            return res.status(400).json({ message: 'Name, phone, and email are required.' });
        }

        const existingUser = await usersCollection.findOne({ $or: [{ phone }, { email }] });
        if (existingUser) {
            if (existingUser.phone === phone) return res.status(400).json({ message: 'Phone number is already registered.' });
            if (existingUser.email === email) return res.status(400).json({ message: 'Email is already registered.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const saltRounds = 10;
        const otpHash = await bcrypt.hash(otp, saltRounds);
        
        otpStore[email] = { name, phone, otpHash };

        await transporter.sendMail({
            from: `"NexusMarket" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your NexusMarket Account Verification Code',
            html: `<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;"><h2>Welcome to NexusMarket!</h2><p>Your verification code is:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 10px; border-radius: 5px;">${otp}</p><p>This code does not expire.</p></div>`
        });

        res.status(200).json({ message: 'Verification code sent to your email.' });

    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({ message: 'Error sending verification code.' });
    }
});

app.post('/signup', async (req, res) => {
    try {
        const { name, phone, email, password, otp } = req.body;
        
        if (!name || !phone || !email || !password || !otp) {
            return res.status(400).json({ message: 'All fields, including OTP, are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        const verificationData = otpStore[email];
        if (!verificationData) {
            return res.status(400).json({ message: 'Invalid request. Please verify your email first.' });
        }
        
        const isOtpMatch = await bcrypt.compare(otp, verificationData.otpHash);
        if (!isOtpMatch) {
            return res.status(400).json({ message: 'The verification code is incorrect.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = {
            name, phone, email, password: hashedPassword,
            wishlist: [], cart: [], orders: [], viewedItems: [],
            address: {}, recommendations: [], deliveredItems: []
        };
        await usersCollection.insertOne(newUser);

        try {
            // 🧠 USES INTELLIGENT FRONTEND_URL
            const welcomeEmailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px; text-align: center; color: #333;"><h1 style="color: #4f46e5;">🎉 Welcome to NexusMarket, ${name}!</h1><p style="font-size: 16px;">Your account has been successfully created. We're thrilled to have you join our community.</p><p style="font-size: 16px;">You can now sign in using your credentials and start exploring thousands of products.</p><div style="margin: 30px 0;"><a href="${FRONTEND_URL}/signin.html" style="background-color: #6b21a8; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Shopping Now</a></div></div>`;
            
            await transporter.sendMail({
                from: `"NexusMarket" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Welcome to NexusMarket! Your Account is Ready.',
                html: welcomeEmailHtml
            });
            console.log(`✅ Welcome email sent successfully to ${email}`);
        } catch (emailError) {
            console.error(`❌ Failed to send welcome email to ${email}:`, emailError);
        }
        
        delete otpStore[email];

        res.status(201).json({ message: 'Account created successfully!' });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: 'Error creating user.' });
    }
});

app.post('/signin', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ message: 'Mobile/Email and password are required.' });
        }
        const user = await usersCollection.findOne({ 
            $or: [{ phone: identifier }, { email: identifier }] 
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }
        res.status(200).json({ message: 'Login successful!', token: user.phone, name: user.name });
    } catch (error) {
        console.error("Signin Error:", error);
        res.status(500).json({ message: 'Error signing in.' });
    }
});

app.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email address is required.' });
        }
        
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'This email is not registered. Please check the email or sign up.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const saltRounds = 10;
        const hashedOtp = await bcrypt.hash(otp, saltRounds);

        await usersCollection.updateOne(
            { email },
            { $set: { resetOtpHash: hashedOtp } }
        );

        await transporter.sendMail({
            from: `"NexusMarket" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your NexusMarket Password Reset Code',
            html: `<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;"><h2>Password Reset Request</h2><p>Your verification code is:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 10px; border-radius: 5px;">${otp}</p><p>This code does not expire.</p></div>`
        });

        res.status(200).json({ message: 'A password reset code has been sent to your email.' });

    } catch (error) {
        console.error("Request Password Reset Error:", error);
        res.status(500).json({ message: 'Error processing your request.' });
    }
});

app.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required.' });
        }
        
        const user = await usersCollection.findOne({ email });
        if (!user || !user.resetOtpHash) {
            return res.status(400).json({ message: 'Invalid request or no OTP was requested.' });
        }
        
        const isOtpMatch = await bcrypt.compare(otp, user.resetOtpHash);
        if (!isOtpMatch) {
            return res.status(400).json({ message: 'The verification code is incorrect.' });
        }

        res.status(200).json({ message: 'OTP verified successfully.' });

    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ message: 'Error verifying OTP.' });
    }
});

app.post('/verify-otp-and-reset', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }
        
        const user = await usersCollection.findOne({ email });
        if (!user || !user.resetOtpHash) {
            return res.status(400).json({ message: 'Invalid request or no OTP was requested.' });
        }
        
        const isOtpMatch = await bcrypt.compare(otp, user.resetOtpHash);
        if (!isOtpMatch) {
            return res.status(400).json({ message: 'The verification code is incorrect.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await usersCollection.updateOne(
            { email },
            { 
                $set: { password: hashedPassword },
                $unset: { resetOtpHash: "" }
            }
        );

        res.status(200).json({ message: 'Password has been reset successfully. Please sign in.' });

    } catch (error) {
        console.error("Verify OTP and Reset Error:", error);
        res.status(500).json({ message: 'Error resetting password.' });
    }
});

// --- USER DATA ENDPOINTS ---
function getPhone(req) {
    return req.headers['x-phone'];
}

app.get('/api/user/data', async (req, res) => {
    const phone = getPhone(req);
    if (!phone) return res.status(401).json({ message: 'Not authenticated' });

    try {
        let user = await usersCollection.findOne({ phone });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 1. Process status updates (Moves recently delivered items to history)
        const { user: updatedUser, requiresDbUpdate } = await processOrderStatusUpdates(user);
        
        // 2. FORCE RECALCULATE POINTS based on ALL delivered items (Past & Present)
        const correctPoints = calculatePointsFromHistory(updatedUser.deliveredItems);
        
        // 3. Update DB if status changed OR if points count was wrong
        if (requiresDbUpdate || user.rewardPoints !== correctPoints) {
            await usersCollection.updateOne(
                { phone: updatedUser.phone }, 
                { $set: { 
                    orders: updatedUser.orders,
                    deliveredItems: updatedUser.deliveredItems,
                    rewardPoints: correctPoints // <--- Saves the corrected total
                }}
            );
            updatedUser.rewardPoints = correctPoints; // Ensure frontend sees the new value
            console.log(`✅ Points synced for ${phone}: ${correctPoints}`);
        }

        res.json(updatedUser);
    } catch (error) {
        console.error("Error retrieving user data:", error);
        res.status(500).json({ message: 'Server error retrieving user data' });
    }
});

app.post('/api/user/wishlist', async (req, res) => {
    const phone = getPhone(req);
    const { product } = req.body;
    if (!phone) return res.status(401).json({ message: 'Not authenticated' });
    try {
        const user = await usersCollection.findOne({ phone });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const isProductInWishlist = (user.wishlist || []).some(item => item.name === product.name);
        const updateOperation = isProductInWishlist 
            ? { $pull: { wishlist: { name: product.name } } } 
            : { $addToSet: { wishlist: product } };
            
        await usersCollection.updateOne({ phone }, updateOperation);
        
        runRecommender(phone);
        res.json({ success: true, message: 'Wishlist updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating wishlist' });
    }
});

app.post('/api/user/cart', async (req, res) => {
    const phone = getPhone(req);
    const { product } = req.body;
    if (!phone) return res.status(401).json({ message: 'Not authenticated' });
    try {
        const user = await usersCollection.findOne({ phone, "cart.name": product.name });
        
        if (user) {
            await usersCollection.updateOne({ phone, "cart.name": product.name }, { $inc: { "cart.$.quantity": 1 } });
        } else {
            product.quantity = 1;
            await usersCollection.updateOne({ phone }, { $push: { cart: product } });
        }
        
        runRecommender(phone);
        res.json({ success: true, message: 'Cart updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating cart' });
    }
});

app.put('/api/user/cart/quantity', async (req, res) => {
    const phone = getPhone(req);
    const { productName, newQuantity } = req.body;
    if (!phone) return res.status(401).json({ message: 'Not authenticated' });
    try {
        if (newQuantity < 1) {
            await usersCollection.updateOne({ phone }, { $pull: { cart: { name: productName } } });
            runRecommender(phone);
        } else {
            await usersCollection.updateOne({ phone, "cart.name": productName }, { $set: { "cart.$.quantity": newQuantity } });
        }
        res.json({ success: true, message: 'Quantity updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating quantity' });
    }
});

app.delete('/api/user/cart/remove', async (req, res) => {
    const phone = getPhone(req);
    const { productName } = req.body;
    if (!phone) return res.status(401).json({ message: 'Not authenticated' });
    try {
        await usersCollection.updateOne({ phone }, { $pull: { cart: { name: productName } } });
        runRecommender(phone);
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ message: 'Server error removing item' });
    }
});

app.put('/api/user/address', async (req, res) => {
    const phone = getPhone(req);
    const { address } = req.body;
    if (!phone) return res.status(401).json({ message: 'Not authenticated' });

    if (address && address.mobile && !/^\d{10}$/.test(address.mobile)) {
        return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
    }

    try {
        await usersCollection.updateOne({ phone }, { $set: { address: address } });
        res.json({ success: true, message: 'Address updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating address' });
    }
});

app.post('/api/user/orders', async (req, res) => {
    const phone = getPhone(req);
    const { order } = req.body;
    if (!phone || !order) return res.status(400).json({ message: 'Missing data' });

    try {
        const user = await usersCollection.findOne({ phone });
        if (!user || !user.email) return res.status(404).json({ message: 'User not found.' });

        const orderDate = new Date(order.orderDate);
        const shippedDate = new Date(orderDate);
        shippedDate.setDate(shippedDate.getDate() + 2);
        const finalDeliveryDate = new Date(orderDate);
        finalDeliveryDate.setDate(finalDeliveryDate.getDate() + 4);
        const outForDeliveryDate = new Date(finalDeliveryDate); 

        order.status = 'Processing';
        order.confirmationEmail = user.email;
        order.shippedDate = shippedDate.toISOString();
        order.outForDeliveryDate = outForDeliveryDate.toISOString();
        order.estimatedDelivery = finalDeliveryDate.toISOString();
        order.deliveryOTP = null;
        order.outForDeliveryEmailSent = false;
        order.deliveryConfirmationEmailSent = false;

        await usersCollection.updateOne(
            { phone }, 
            { $push: { orders: { $each: [order], $position: 0 } }, $set: { cart: [] } }
        );
        
        try {
            const itemsHtml = order.items.map(item => `<tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;">${item.name || 'N/A'} (x${item.quantity || 1})</td><td style="padding: 10px; text-align: right;">₹${((typeof item.pricePaid === 'number' ? item.pricePaid : (typeof item.price === 'number' ? item.price : 0)) * (item.quantity || 1)).toFixed(2)}</td></tr>`).join('');
            const formattedOrderDate = new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
            const formattedDeliveryDate = finalDeliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
            const addr = order.shippingAddress || {};
            const addressHtml = `${addr.name || ''}<br>${addr.address || ''}, ${addr.city || ''}<br>${addr.state || ''}, ${addr.pincode || ''}`;
            
            const emailHtml = `<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;"><h1>Thank you for your order!</h1><p><strong>Order ID:</strong> ${order.orderId}</p><p><strong>Order Date:</strong> ${formattedOrderDate}</p><p><strong>Estimated Delivery:</strong> ${formattedDeliveryDate}</p><hr><h2 style="color: #333;">Order Summary</h2><table style="width: 100%; border-collapse: collapse;">${itemsHtml}<tr style="font-weight: bold;"><td style="padding: 10px;">Total</td><td style="padding: 10px; text-align: right;">₹${(order.totalAmount || 0).toFixed(2)}</td></tr></table><hr><p><strong>Shipping Address:</strong><br>${addressHtml}</p></div>`;
                
            await transporter.sendMail({
                from: `"NexusMarket" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: `Your NexusMarket Order Confirmation #${order.orderId}`,
                html: emailHtml
            });
            console.log(`✅ Order confirmation email sent to ${user.email}`);
        } catch (emailError) {
            console.error(`❌ Failed to send order confirmation email to ${user.email}:`, emailError);
        }
        
        res.status(200).json({ success: true, message: 'Order placed successfully' });
    } catch (error) {
        console.error("Server error creating order:", error);
        res.status(500).json({ message: 'Server error creating order' });
    }
});

app.put('/api/user/orders/cancel', async (req, res) => {
    const phone = getPhone(req);
    const { orderId } = req.body;
    if (!phone) return res.status(401).json({ message: 'Not authenticated' });
    try {
        const userWithOrder = await usersCollection.findOne(
            { phone: phone, "orders.orderId": orderId },
            { projection: { name: 1, "orders.$": 1 } }
        );

        if (!userWithOrder || !userWithOrder.orders || userWithOrder.orders.length === 0) {
            return res.status(404).json({ message: "Order not found." });
        }

        const orderToCancel = userWithOrder.orders[0];

        if (orderToCancel.confirmationEmail) {
            try {
                const canceledItemsHtml = orderToCancel.items.map(item => `<li>${item.name} (Qty: ${item.quantity})</li>`).join('');
                await transporter.sendMail({
                    from: `"NexusMarket" <${process.env.EMAIL_USER}>`, 
                    to: orderToCancel.confirmationEmail,
                    subject: `Your NexusMarket Order #${orderId} has been cancelled`,
                    html: `<div style="font-family: sans-serif;"><p>Hi ${userWithOrder.name}, this is a confirmation that your order <b>#${orderId}</b> has been successfully cancelled.</p><p>The following items have been removed from your order:</p><ul>${canceledItemsHtml}</ul><p>Any payments made will be refunded according to our policy.</p></div>`
                });
                console.log(`Cancellation email sent for order ${orderId}`);
            } catch (emailError) {
                console.error(`Failed to send cancellation email for order ${orderId}:`, emailError);
            }
        }

        await usersCollection.updateOne({ phone }, { $pull: { orders: { orderId: orderId } } });
        
        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error("Server error cancelling order:", error);
        res.status(500).json({ message: 'Server error cancelling order' });
    }
});

app.post('/api/user/returns/request-otp', async (req, res) => {
    const phone = getPhone(req);
    const { itemId, reason } = req.body;
    if (!phone || !itemId || !reason) {
        return res.status(400).json({ message: 'Missing required information.' });
    }

    try {
        const user = await usersCollection.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const itemToReturn = (user.deliveredItems || []).find(item => item._id.toString() === itemId);
        if (!itemToReturn) {
            return res.status(404).json({ message: 'Item not found in your delivered history.' });
        }

        const today = new Date();
        const deliveryDate = new Date(itemToReturn.deliveryDate);
        const timeDifference = today.getTime() - deliveryDate.getTime();
        const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

        if (daysDifference > 4) {
            return res.status(400).json({ message: 'The return window for this item has expired.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        await usersCollection.updateOne(
            { phone, "deliveredItems._id": new ObjectId(itemId) },
            { $set: { "deliveredItems.$.returnOTP": { hash: hashedOtp, reason: reason } } }
        );

        const emailHtml = `<p>Your One-Time Password (OTP) to confirm your return for <b>${itemToReturn.name}</b> is:</p><h1 style="font-size: 36px; letter-spacing: 5px;">${otp}</h1><p>This code does not expire.</p>`;
        await transporter.sendMail({
            from: `"NexusMarket" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Your NexusMarket Return Verification Code`,
            html: emailHtml
        });

        console.log(`✅ Return OTP sent to ${user.email} for item ${itemId}`);
        res.status(200).json({ message: 'OTP sent to your email.' });

    } catch (error) {
        console.error("Error requesting return OTP:", error);
        res.status(500).json({ message: 'Server error sending OTP.' });
    }
});

app.post('/api/user/returns/finalize', async (req, res) => {
    const phone = getPhone(req);
    const { itemId, otp } = req.body;
    if (!phone || !itemId || !otp) {
        return res.status(400).json({ message: 'Missing required information.' });
    }

    try {
        const user = await usersCollection.findOne({ phone });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const itemToReturn = (user.deliveredItems || []).find(item => item._id.toString() === itemId);
        if (!itemToReturn || !itemToReturn.returnOTP) {
            return res.status(400).json({ message: 'Return process was not initiated for this item.' });
        }

        const isOtpMatch = await bcrypt.compare(otp, itemToReturn.returnOTP.hash);
        if (!isOtpMatch) {
            return res.status(400).json({ message: 'The verification code is incorrect.' });
        }

        await usersCollection.updateOne(
            { phone },
            { $pull: { deliveredItems: { _id: new ObjectId(itemId) } } }
        );

        const reason = itemToReturn.returnOTP.reason;
        const emailHtml = `<p>Hi ${user.name},</p><p>This email confirms that your return for <b>${itemToReturn.name}</b> has been successfully processed.</p><p><b>Reason provided:</b> ${reason}</p><p>Your refund will be processed shortly.</p>`;
        await transporter.sendMail({
            from: `"NexusMarket" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Return Confirmed for "${itemToReturn.name}"`,
            html: emailHtml
        });
        
        console.log(`✅ Final return confirmation sent to ${user.email} for item ${itemId}`);
        res.json({ success: true, message: "Return processed successfully." });

    } catch (error) {
        console.error("Error finalizing return:", error);
        res.status(500).json({ message: 'Server error finalizing return.' });
    }
});

app.get('/api/user/order/:orderId', async (req, res) => {
    const phone = getPhone(req);
    const { orderId } = req.params;

    if (!phone) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const userWithOrder = await usersCollection.findOne(
            { phone: phone, "orders.orderId": orderId },
            { projection: { "orders.$": 1 } }
        );

        if (!userWithOrder || !userWithOrder.orders || userWithOrder.orders.length === 0) {
            return res.status(404).json({ message: "Order not found." });
        }

        const order = userWithOrder.orders[0];
        const user = await usersCollection.findOne({ phone: phone });
        
        const orderDetails = {
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone,
            ...order
        };
        
        res.json(orderDetails);

    } catch (error) {
        console.error("Error retrieving single order:", error);
        res.status(500).json({ message: 'Server error retrieving order details' });
    }
});

app.post('/api/user/viewed', async (req, res) => {
    const phone = getPhone(req);
    const { product } = req.body;
    if (!phone) return res.status(401).json({ message: 'Not authenticated.' });
    if (!product || !product.name) return res.status(400).json({ message: 'Product data is required.' });
    
    try {
        // We still SAVE the view to the database for history
        await usersCollection.updateOne({ phone }, { $pull: { viewedItems: { name: product.name } } });
        await usersCollection.updateOne({ phone }, { 
            $push: { 
                viewedItems: { 
                    $each: [product], 
                    $position: 0, 
                    $slice: 100 
                } 
            } 
        });
        
        res.json({ success: true, message: 'Viewed item updated.' });
    } catch (error) {
        console.error("Error updating viewed items:", error);
        res.status(500).json({ message: 'Server error updating viewed items.' });
    }
});

app.delete('/api/user/recommendations', async (req, res) => {
    const phone = getPhone(req);
    if (!phone) return res.status(401).json({ message: 'Not authenticated' });
    try {
        await usersCollection.updateOne(
            { phone }, 
            { $set: { recommendations: [], viewedItems: [] } }
        );
        res.json({ success: true, message: 'Recommendations and viewed items cleared' });
    } catch (error) {
        console.error("Clear Recommendations Error:", error);
        res.status(500).json({ message: 'Server error clearing recommendations' });
    }
});

// --- STUDENT DISCOUNT ENDPOINTS ---
app.post('/api/user/request-discount-code', async (req, res) => {
    const phone = getPhone(req);
    const { studentEmail, productName } = req.body;
    if (!phone || !studentEmail || !productName) {
        return res.status(400).json({ message: 'Missing required information.' });
    }
    if (!studentEmail.endsWith('.edu.in')) {
        return res.status(400).json({ message: 'Please enter a valid .edu.in college email.' });
    }
    try {
        const user = await usersCollection.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: "Authenticated user not found in database." });
        }
        const productInCart = user.cart.find(item => item.name === productName);
        if (!productInCart) {
            return res.status(404).json({ message: 'Product not found in your cart.' });
        }
        
        if (productInCart.discount > 0) {
            return res.status(400).json({ message: 'Discount is already applied to this item.' });
        }
        
        const discountedItemsCount = user.cart.filter(item => item.discount && item.discount > 0).length;
        if (discountedItemsCount >= 5) {
            return res.status(400).json({ message: 'Student discount limit of 5 products reached.' });
        }
        
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        await usersCollection.updateOne(
            { phone, "cart.name": productName },
            { $set: { "cart.$.verification": { code: verificationCode } } }
        );
        
        await transporter.sendMail({
            from: `"NexusMarket" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: 'Your NexusMarket Discount Code',
            html: `<p>Your verification code for the discount on <b>${productName}</b> is:</p><h1 style="font-size: 36px; letter-spacing: 5px;">${verificationCode}</h1><p>This code does not expire.</p>`
        });
        
        res.json({ message: `A verification code was sent to ${studentEmail}.` });
    } catch (error) {
        console.error("Error requesting discount code:", error);
        res.status(500).json({ message: 'Failed to send verification code.' });
    }
});

app.post('/api/user/verify-discount-code', async (req, res) => {
    const phone = getPhone(req);
    const { verificationCode, productName } = req.body;
    if (!phone || !verificationCode || !productName) {
        return res.status(400).json({ message: 'Missing required information.' });
    }
    try {
        const user = await usersCollection.findOne({ phone });
        if (!user) return res.status(404).json({ message: "User not found." });
        
        const productInCart = user.cart.find(item => item.name === productName);
        if (!productInCart || !productInCart.verification) {
            return res.status(400).json({ message: 'No verification code was requested for this item.' });
        }
        
        if (productInCart.verification.code !== verificationCode) {
            return res.status(400).json({ message: 'The verification code is incorrect.' });
        }
        
        await usersCollection.updateOne(
            { phone, "cart.name": productName },
            { $set: { "cart.$.discount": 10 }, $unset: { "cart.$.verification": "" } }
        );
        
        res.json({ success: true, message: 'Discount applied successfully!' });
    } catch (error) {
        console.error("Error verifying discount code:", error);
        res.status(500).json({ message: 'Server error during verification.' });
    }
});

// --- Bank Offer Endpoint ---
app.put('/api/user/cart/offer', async (req, res) => {
    const phone = getPhone(req);
    const { productName, offerId, accountNumber } = req.body;

    if (!phone || !productName || !offerId) {
        return res.status(400).json({ message: 'Missing required information.' });
    }

    try {
        const finalAccountNumber = (offerId === 'none') ? null : accountNumber;
        
        const updateResult = await usersCollection.updateOne(
            { phone, "cart.name": productName },
            { $set: { 
                "cart.$.selectedOfferId": offerId,
                "cart.$.accountNumber": finalAccountNumber
            }}
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ message: 'Product not found in cart.' });
        }
        
        runRecommender(phone);
        res.json({ success: true, message: 'Offer updated successfully.' });
    } catch (error) {
        console.error("Error updating cart offer:", error);
        res.status(500).json({ message: 'Server error updating offer.' });
    }
});


app.post('/api/user/review', async (req, res) => {
    const phone = getPhone(req);
    if (!phone) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    const { itemId, category, overallRating, reviewText, subRatings, productName } = req.body;

    if (!itemId || !category || !overallRating || !reviewText) {
        return res.status(400).json({ message: 'Missing required review data.' });
    }

    try {
        // 1. Find the user and the specific item they are reviewing
        const user = await usersCollection.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const itemToReview = (user.deliveredItems || []).find(item => item._id.toString() === itemId);

        if (!itemToReview) {
            return res.status(404).json({ message: 'Delivered item not found.' });
        }

        // 2. Check if this item instance has already been reviewed
        if (itemToReview.reviewed) {
            return res.status(400).json({ message: 'You have already reviewed this item.' });
        }

        // 3. Create the new review object
        const newReview = {
            _id: new ObjectId(),
            itemId: new ObjectId(itemId), // Reference to the deliveredItems _id
            productName: productName,
            category: category,
            overallRating: overallRating,
            reviewText: reviewText,
            subRatings: subRatings || {}, // Store sub-ratings (or empty object)
            date: new Date().toISOString()
        };

        // 4. Atomically update the user document
        const updateResult = await usersCollection.updateOne(
            { phone, "deliveredItems._id": new ObjectId(itemId) },
            {
                $push: { reviews: newReview },         // Add new review to the reviews array
                $set: { "deliveredItems.$.reviewed": true } // Mark the item as reviewed
            }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ message: 'Failed to save review. Item may have been modified.' });
        }
        
        console.log(`✅ Review saved for user ${phone}, item ${productName}`);
        res.status(201).json({ message: 'Thank you! Your review has been submitted.' });

    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ message: 'A server error occurred. Please try again later.' });
    }
});

// --- Support Ticket Endpoint ---
app.post('/api/user/contact-support', async (req, res) => {
    const phone = getPhone(req);
    if (!phone) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    const { category, message } = req.body;
    if (!category || !message) {
        return res.status(400).json({ message: 'Category and message are required.' });
    }

    try {
        const user = await usersCollection.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const emailHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;"><div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0; font-size: 24px;">New Customer Support Ticket</h1></div><div style="padding: 20px;"><h2 style="color: #4f46e5; border-bottom: 2px solid #eee; padding-bottom: 10px;">User Information</h2><p><strong>Name:</strong> ${user.name}</p><p><strong>Email:</strong> ${user.email}</p><p><strong>Phone:</strong> ${user.phone}</p><p><em>(Click 'Reply' to respond directly to this user)</em></p><h2 style="color: #4f46e5; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px;">Issue Details</h2><p><strong>Category:</strong> ${category}</p><p><strong>Message:</strong></p><div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border: 1px solid #eee;"><p style="margin: 0; white-space: pre-wrap;">${message}</p></div></div><div style="background-color: #f4f4f4; color: #777; padding: 15px; text-align: center; font-size: 12px;"><p>This is an automated message from the NexusMarket system.</p></div></div>`;

        await transporter.sendMail({
            from: `"NexusMarket System" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            replyTo: user.email,
            subject: `[Support Ticket] - ${category} from ${user.name}`,
            html: emailHtml
        });
        
        console.log(`✅ Support ticket from ${user.email} has been logged in the support inbox.`);
        res.status(200).json({ message: 'Your message has been sent successfully!' });

    } catch (error) {
        console.error("Error sending support ticket:", error);
        res.status(500).json({ message: 'A server error occurred. Please try again later.' });
    }
});

// Endpoint to DELETE profile image
app.delete('/api/user/profile-image', async (req, res) => {
    const phone = getPhone(req);
    if (!phone) return res.status(401).json({ message: 'Not authenticated' });

    try {
        await usersCollection.updateOne(
            { phone }, 
            { $unset: { profileImage: "" } } // This removes the field completely
        );
        res.json({ success: true, message: 'Profile image removed' });
    } catch (error) {
        console.error("Error removing profile image:", error);
        res.status(500).json({ message: 'Server error removing image' });
    }
});

// Endpoint to UPDATE profile image
app.put('/api/user/profile-image', async (req, res) => {
    const phone = getPhone(req);
    if (!phone) return res.status(401).json({ message: 'Not authenticated' });
    try {
        await usersCollection.updateOne(
            { phone },
            { $set: { profileImage: req.body.image } }
        );
        res.json({ success: true, message: 'Image updated' });
    } catch (error) {
        console.error("Error updating profile image:", error);
        res.status(500).json({ message: 'Error updating image' });
    }
});

// --- 5. START SERVER ---
connectToDbAndStartServer();
// server.js

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
// --- 1. IMPORTS ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// --- 2. APP INITIALIZATION & MIDDLEWARE ---
const app = express();

// --- [FIX PART 1] Serve all files from the 'public' folder ---
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

const otpStore = {}; // In-memory store for signup OTPs

// ALLOW Netlify and Localhost
app.use(cors({
    origin: '*', // Allows all origins (easiest for local testing)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-phone']
}));

// Increase limit to 50mb
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 3. MONGODB CONNECTION SETUP ---
const uri = process.env.MONGO_URI;
let usersCollection;
const client = new MongoClient(uri);

// --- NODEMAILER TRANSPORTER ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: false, // Must be false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ============================================================
//  👇 JAVASCRIPT RECOMMENDATION ENGINE 👇
// ============================================================

// Helper: Read the product file directly
// Inside server.js

function getFlattenedProducts() {
    try {
        // CHANGED: Point to the 'javascript' folder
        // NOTE: Ensure your folder on GitHub is named exactly 'javaScript' or 'javascript'
        const productFilePath = path.join(__dirname, 'javaScript', 'products.json'); 
        
        if (!fs.existsSync(productFilePath)) {
            console.error("❌ javaScript/products.json not found. Recommendations cannot run.");
            return [];
        }
        
        const rawData = fs.readFileSync(productFilePath, 'utf-8');
        const parsedData = JSON.parse(rawData);
        
        if (Array.isArray(parsedData)) {
            return parsedData;
        }

        return [];
    } catch (err) {
        console.error("Error loading products for recommendations:", err);
        return [];
    }
}

// Helpers: Similarity Logic
function getBrand(name) {
    return name ? name.split(' ')[0].toLowerCase() : "";
}

function getGender(name) {
    if (!name) return "unisex";
    const n = name.toLowerCase();
    if (n.includes('men') || n.includes("men's") || n.includes('boy')) return 'male';
    if (n.includes('women') || n.includes("women's") || n.includes('girl')) return 'female';
    return 'unisex';
}

function calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    const set1 = new Set(name1.toLowerCase().split(' '));
    const set2 = new Set(name2.toLowerCase().split(' '));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.size / union.size : 0;
}

// Main Function to Generate Recommendations
// ============================================================
//  👇 HYBRID ENGINE: NODE CALLS PYTHON 👇
// ============================================================
function generateAndSaveRecommendations(phone) {
    return new Promise((resolve, reject) => {
        // 1. Define paths and arguments
        const scriptPath = path.join(__dirname, 'recommender.py');
        const productsPath = path.join(__dirname, 'public', 'javaScript', 'products.json');
        const mongoUri = process.env.MONGO_URI;

        console.log(`🧠 Spawning Python Script for user: ${phone}`);

        // 2. Spawn Python Process
        // Arguments matches your python code: [phone, products_file, mongo_uri]
        // DETECT OS: If Windows, use 'python', otherwise use 'python3'
        const pythonCommand = process.platform === "win32" ? "python" : "python3";
        
        console.log(`🧠 Spawning Python Script for user: ${phone} using command: ${pythonCommand}`);

        // Spawn Python Process with the correct command
        const pythonProcess = spawn(pythonCommand, [scriptPath, phone, productsPath, mongoUri]);
        // 3. Log Output
        pythonProcess.stdout.on('data', (data) => {
            console.log(`🐍 Python Output: ${data.toString().trim()}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`🐍 Python Error: ${data.toString().trim()}`);
        });

        // 4. Handle Completion
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Python recommendation finished successfully.');
                resolve();
            } else {
                console.error(`❌ Python script exited with code ${code}`);
                resolve(); // Resolve anyway to keep server alive
            }
        });
    });
}
// ============================================================


async function connectToDbAndStartServer() {
    try {
        // 1. (REMOVED) initializeProductData call - we assume products.json exists now

        // 2. Connect to DB
        await client.connect();
        const database = client.db("nexusMarketDB");
        usersCollection = database.collection("users");
        console.log("✅ Successfully connected to MongoDB.");

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
        
        startScheduledTasks();
    } catch (error) {
        console.error("❌ Could not connect to MongoDB", error);
        process.exit(1);
    }
}

// --- ORDER STATUS UPDATE FUNCTION ---
// --- IMPROVED ORDER STATUS & EMAIL LOGIC ---

async function processOrderStatusUpdates(user) {
    const today = new Date();
    let requiresDbUpdate = false;
    const itemsToAddToDelivered = [];
    
    // Ensure rewardPoints is a number
    if (typeof user.rewardPoints !== 'number') user.rewardPoints = 0;
    
    // Safety check
    if (!user.orders || user.orders.length === 0) return { user, requiresDbUpdate: false };

    // Iterate through active orders (oldest first usually, but order doesn't strictly matter here)
    for (const order of user.orders) {
        
        // Skip completed orders
        if (order.status === 'Delivered' || order.status === 'Cancelled') continue;

        // Parse Dates
        const shippedDate = new Date(order.shippedDate);
        const outForDeliveryDate = new Date(order.outForDeliveryDate);
        const deliveryDate = new Date(order.estimatedDelivery); // The scheduled delivery time

        // --- PHASE 1: SHIPPED CHECK ---
        if (order.status === 'Processing' && today >= shippedDate) {
            order.status = 'Shipped';
            requiresDbUpdate = true;
        }

        // --- PHASE 2: OUT FOR DELIVERY (OTP Logic) ---
        // Logic: If today is ON or AFTER the scheduled date, and we haven't sent the email yet.
        const isTimeForOutForDelivery = today >= outForDeliveryDate;

        if (isTimeForOutForDelivery && order.status !== 'Delivered' && order.status !== 'Out for Delivery') {
            order.status = 'Out for Delivery';
            requiresDbUpdate = true;

            // Generate OTP if missing
            if (!order.deliveryOTP) {
                order.deliveryOTP = Math.floor(100000 + Math.random() * 900000).toString();
            }

            // Send OTP Email (Catch-up mechanism: Sends now even if late)
            if (!order.outForDeliveryEmailSent) {
                order.outForDeliveryEmailSent = true;
                
                console.log(`🚚 Triggering 'Out for Delivery' Email (Catch-up Mode) for Order #${order.orderId}`);
                
                const emailHtml = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #4f46e5, #7c3aed); padding: 20px; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 24px;">🚚 Out for Delivery</h2>
                    </div>
                    <div style="padding: 25px; background-color: #ffffff;">
                        <p style="font-size: 16px; color: #333;">Hello <strong>${user.name}</strong>,</p>
                        <p style="color: #555;">Your package is out for delivery today! Please share the OTP below with the delivery agent.</p>
                        
                        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Your Delivery OTP</span>
                            <span style="display: block; font-size: 32px; font-weight: bold; color: #111; letter-spacing: 5px; margin-top: 5px;">${order.deliveryOTP}</span>
                        </div>
                        
                        <p style="font-size: 14px; color: #888;">Order ID: #${order.orderId}</p>
                    </div>
                </div>`;

                try {
                    await transporter.sendMail({
                        from: `"NexusMarket Logistics" <${process.env.EMAIL_USER}>`,
                        to: order.confirmationEmail,
                        subject: `Out for Delivery: OTP for Order #${order.orderId}`,
                        html: emailHtml
                    });
                    console.log(`✅ Out for Delivery OTP sent to ${order.confirmationEmail}`);
                } catch (e) { console.error("Email Error:", e); }
            }
            
            // IMPORTANT: Return here! 
            // We stop processing this order for this cycle. 
            // This ensures the user sees "Out for Delivery" first, even if we are late.
            // The "Delivered" status will happen on the NEXT cron run (30 mins later) or next refresh.
            continue; 
        }

        // --- PHASE 3: DELIVERED (Consolidated Email Logic) ---
        // Logic: If status is 'Out for Delivery' AND specific time passed (e.g., 4 hours after OutForDelivery)
        // OR if it's the next day.
        
        // We add a buffer (e.g., 4 hours after outForDeliveryDate) to simulate delivery time
        const simulatedDeliveryTime = new Date(outForDeliveryDate.getTime() + (4 * 60 * 60 * 1000));
        const isTimeForDelivery = today >= simulatedDeliveryTime;

        if (order.status === 'Out for Delivery' && isTimeForDelivery && !order.deliveryConfirmationEmailSent) {
            
            // 1. Update Status
            order.status = 'Delivered';
            order.actualDeliveryDate = today.toISOString(); // Set delivery date to NOW (Catch-up logic)
            order.deliveryConfirmationEmailSent = true;
            requiresDbUpdate = true;

            // 2. Calculate Points & Process Items
            let pointsEarned = 0;
            const deliveredItemsData = order.items.map(item => {
                const finalPrice = item.pricePaid !== undefined ? item.pricePaid : item.price;
                const quantity = item.quantity || 1;
                
                // Point Logic
                let pointsPerItem = 2;
                if (finalPrice > 100000) pointsPerItem = 50;
                else if (finalPrice > 50000) pointsPerItem = 40;
                else if (finalPrice > 25000) pointsPerItem = 25;
                else if (finalPrice > 10000) pointsPerItem = 15;
                else if (finalPrice > 5000) pointsPerItem = 5;

                pointsEarned += (pointsPerItem * quantity);

                return {
                    ...item,
                    orderId: order.orderId,
                    deliveryDate: today.toISOString(),
                    category: item.category || 'General',
                    reviewed: false,
                    _id: new ObjectId()
                };
            });

            // 3. Update User Data
            if (pointsEarned > 0) user.rewardPoints += pointsEarned;
            itemsToAddToDelivered.push(...deliveredItemsData);

            // 4. PREPARE CONSOLIDATED EMAIL DATA
            const address = order.shippingAddress;
            const addressStr = `${address.name}<br>${address.address}<br>${address.city}, ${address.state} - ${address.pincode}<br>Phone: ${address.mobile}`;
            
            const itemsHtmlRows = order.items.map(item => `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 5px; vertical-align: middle;">
                        <img src="${item.image}" alt="Product" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px; border: 1px solid #eee;">
                    </td>
                    <td style="padding: 12px 10px; font-size: 14px; color: #333;">
                        <strong>${item.name}</strong>
                        <div style="font-size: 12px; color: #777;">Qty: ${item.quantity}</div>
                    </td>
                    <td style="padding: 12px 5px; text-align: right; font-weight: bold; color: #333;">
                        ₹${((item.pricePaid || item.price) * item.quantity).toFixed(2)}
                    </td>
                </tr>
            `).join('');

            // 5. SEND CONSOLIDATED EMAIL
            const deliveredEmailHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #fafafa;">
                
                <div style="background-color: #10b981; padding: 25px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 26px; letter-spacing: 1px;">Delivery Successful!</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Your package has arrived safely.</p>
                </div>

                <div style="background-color: #ecfdf5; border-bottom: 1px solid #d1fae5; padding: 15px; text-align: center;">
                    <p style="margin: 0; font-size: 16px; color: #065f46;">
                        🎉 You earned <strong>${pointsEarned} Reward Points</strong> on this order!
                    </p>
                </div>

                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="margin-top: 0; color: #444;">Hi ${user.name},</p>
                    <p style="color: #666; line-height: 1.5;">We are happy to inform you that your order <strong>#${order.orderId}</strong> has been delivered.</p>

                    <h3 style="font-size: 14px; text-transform: uppercase; color: #888; border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 25px;">Items Delivered</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        ${itemsHtmlRows}
                    </table>

                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold; color: #333;">Total Amount Paid</span>
                        <span style="font-weight: bold; color: #4f46e5; font-size: 18px;">₹${order.totalAmount.toFixed(2)}</span>
                    </div>

                    <h3 style="font-size: 14px; text-transform: uppercase; color: #888; border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px;">Delivered To</h3>
                    <p style="font-size: 14px; color: #444; line-height: 1.6; background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 6px;">
                        ${addressStr}
                    </p>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="http://localhost:5500/orders.html" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px;">View Order Details</a>
                    </div>
                </div>

                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee;">
                    <p>Thank you for shopping with NexusMarket.</p>
                </div>
            </div>`;

            try {
                await transporter.sendMail({
                    from: `"NexusMarket" <${process.env.EMAIL_USER}>`,
                    to: order.confirmationEmail,
                    subject: `Delivered: Order #${order.orderId} was successful`,
                    html: deliveredEmailHtml
                });
                console.log(`✅ Consolidated Delivery Email sent to ${order.confirmationEmail}`);
            } catch (e) { console.error("Email Error:", e); }
        }
    }

    // Add items to history if any
    if (itemsToAddToDelivered.length > 0) {
        if (!user.deliveredItems) user.deliveredItems = [];
        user.deliveredItems.unshift(...itemsToAddToDelivered);
        requiresDbUpdate = true;
    }

    return { user, requiresDbUpdate };
}

// --- Helper: Recalculate Points based on UNIT PRICE ---
function calculatePointsFromHistory(deliveredItems) {
    if (!deliveredItems || deliveredItems.length === 0) return 0;
    
    let totalPoints = 0;
    
    deliveredItems.forEach(item => {
        const finalPrice = item.pricePaid !== undefined ? item.pricePaid : item.price;
        const quantity = item.quantity || 1;
        let pointsPerItem = 0;

        if (finalPrice > 100000) pointsPerItem = 50;
        else if (finalPrice > 50000) pointsPerItem = 40;
        else if (finalPrice > 25000) pointsPerItem = 25;
        else if (finalPrice > 10000) pointsPerItem = 15;
        else if (finalPrice > 5000) pointsPerItem = 5;
        else pointsPerItem = 2;

        totalPoints += (pointsPerItem * quantity);
    });
    
    return totalPoints;
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
            const welcomeEmailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px; text-align: center; color: #333;"><h1 style="color: #4f46e5;">🎉 Welcome to NexusMarket, ${name}!</h1><p style="font-size: 16px;">Your account has been successfully created. We're thrilled to have you join our community.</p><p style="font-size: 16px;">You can now sign in using your credentials and start exploring thousands of products.</p></div>`;
            
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

// Endpoint to upload/update profile image
app.put('/api/user/profile-image', async (req, res) => {
    const phone = getPhone(req);
    const { image } = req.body;

    if (!phone) return res.status(401).json({ message: 'Not authenticated' });
    
    // Safety check: MongoDB documents have a 16MB limit. 
    // We limit the payload here to ensure we don't crash the DB entry.
    if (!image) return res.status(400).json({ message: 'No image data provided.' });

    try {
        await usersCollection.updateOne(
            { phone }, 
            { $set: { profileImage: image } } 
        );
        res.json({ success: true, message: 'Profile image updated successfully' });
    } catch (error) {
        console.error("Error updating profile image:", error);
        res.status(500).json({ message: 'Server error updating profile image' });
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
        
        // --- TRIGGER JS RECOMMENDER ---
        generateAndSaveRecommendations(phone);
        
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
        
        // --- TRIGGER JS RECOMMENDER ---
        generateAndSaveRecommendations(phone);

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
            // Item removed, so update recommendations
            generateAndSaveRecommendations(phone);
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
        // Item removed, so update recommendations
        generateAndSaveRecommendations(phone);
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

// Helper to add random hours/minutes to a date
function setRandomTime(dateObj, startHour, endHour) {
    const newDate = new Date(dateObj);
    const randomHour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
    const randomMinute = Math.floor(Math.random() * 60);
    newDate.setHours(randomHour, randomMinute, 0, 0);
    return newDate;
}

app.post('/api/user/orders', async (req, res) => {
    const phone = getPhone(req);
    const { order } = req.body;
    if (!phone || !order) return res.status(400).json({ message: 'Missing data' });

    try {
        const user = await usersCollection.findOne({ phone });
        if (!user || !user.email) return res.status(404).json({ message: 'User not found.' });

        const orderDate = new Date(order.orderDate);
        
        // --- RANDOM TIME GENERATION ---
        
        // 1. Shipped Date: 2 days later, between 9 AM (9) and 6 PM (18)
        const shipBase = new Date(orderDate);
        shipBase.setDate(shipBase.getDate() + 2);
        const shippedDate = setRandomTime(shipBase, 9, 18);

        // 2. Final Delivery Day: 4 days later
        const deliveryBase = new Date(orderDate);
        deliveryBase.setDate(deliveryBase.getDate() + 4);

        // 3. Out For Delivery: On Delivery Day, between 8 AM (8) and 10 AM (10)
        const outForDeliveryDate = setRandomTime(deliveryBase, 8, 10);

        // 4. Estimated Delivery: On Delivery Day, between 2 PM (14) and 8 PM (20)
        const finalDeliveryDate = setRandomTime(deliveryBase, 14, 20);

        order.status = 'Processing';
        order.confirmationEmail = user.email;
        
        // Store as ISO Strings
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
        
        // ... (Keep existing email sending code below) ...
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

// Endpoint to DELETE profile image
app.delete('/api/user/profile-image', async (req, res) => {
    const phone = getPhone(req);
    if (!phone) return res.status(401).json({ message: 'Not authenticated' });

    try {
        await usersCollection.updateOne(
            { phone }, 
            { $unset: { profileImage: "" } } 
        );
        res.json({ success: true, message: 'Profile image removed' });
    } catch (error) {
        console.error("Error removing profile image:", error);
        res.status(500).json({ message: 'Server error removing image' });
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

        if (daysDifference > 3) {
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
        
        // --- NOTE: We generally avoid running the heavy recommender on every single view for performance, 
        // --- but since we removed Python, we can safely run it if you want, or just leave it for cart/wishlist actions.
        // --- I'll leave it out here to keep it snappy as requested previously.
        
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
        
        // --- TRIGGER JS RECOMMENDER ---
        generateAndSaveRecommendations(phone);
        
        res.json({ success: true, message: 'Offer updated successfully.' });
    } catch (error) {
        console.error("Error updating cart offer:", error);
        res.status(500).json({ message: 'Server error updating offer.' });
    }
});


app.post('/api/user/review', async (req, res) => {
    const phone = getPhone(req);
    if (!phone) return res.status(401).json({ message: 'Authentication required.' });

    // We accept 'rating' (the star count) and 'reviewText'
    const { itemId, category, rating, reviewText, productName } = req.body;

    if (!itemId || !rating || !reviewText) {
        return res.status(400).json({ message: 'Missing required review data.' });
    }

    try {
        const user = await usersCollection.findOne({ phone });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // Create the Review Object
        const newReview = {
            _id: new ObjectId(),
            itemId: new ObjectId(itemId),
            productName: productName,
            category: category || 'General',
            rating: parseInt(rating), // Save as a number (1-5)
            reviewText: reviewText,
            date: new Date().toISOString()
        };

        // Update 1: Add to the specific item in deliveredItems (so we know it's reviewed)
        // Update 2: Push to a 'reviews' array in the user object (or a separate reviews collection if you prefer)
        const updateResult = await usersCollection.updateOne(
            { phone, "deliveredItems._id": new ObjectId(itemId) },
            {
                $set: { "deliveredItems.$.reviewed": true, "deliveredItems.$.myReview": newReview }
            }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ message: 'Failed to save review. Item may not exist.' });
        }
        
        console.log(`✅ Review saved: ${rating} stars for ${productName}`);
        res.status(201).json({ message: 'Review submitted successfully!' });

    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ message: 'Server error saving review.' });
    }
});
// --- NEW ENDPOINT: GET PUBLIC REVIEWS FOR A PRODUCT ---
app.get('/api/product/reviews', async (req, res) => {
    const { productName } = req.query;
    
    if (!productName) return res.status(400).json({ message: 'Product name required' });

    try {
        const pipeline = [
            // 1. Find users who have this product in their history
            { $match: { "deliveredItems.name": productName } },
            
            // 2. Unwind the array so we can filter specific items
            { $unwind: "$deliveredItems" },
            
            // 3. Filter for the specific product AND ensure it has a review
            { $match: { 
                "deliveredItems.name": productName, 
                "deliveredItems.reviewed": true 
            }},
            
            // 4. Project only the necessary data (Review + User Name)
            { $project: {
                _id: 0,
                userName: "$name",
                rating: "$deliveredItems.myReview.rating",
                reviewText: "$deliveredItems.myReview.reviewText",
                date: "$deliveredItems.myReview.date",
                // Generate a random color for the avatar if you want, or handle on frontend
            }}
        ];

        const reviews = await usersCollection.aggregate(pipeline).toArray();

        // Calculate Average
        let average = 0;
        if (reviews.length > 0) {
            const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
            average = (total / reviews.length).toFixed(1);
        }

        res.json({ 
            reviews: reviews.reverse(), // Show newest first
            average: average,
            totalReviews: reviews.length
        });

    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: 'Server error fetching reviews' });
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

// --- [FIX PART 2] CATCH-ALL ROUTE (MUST BE LAST) ---
// This ensures that any page visit that isn't an API call returns your website
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -- 5. START SERVER --
connectToDbAndStartServer();
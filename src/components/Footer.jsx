// client/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2">
            <h3 className="text-xl font-bold text-white mb-4">NexsusMarket</h3>
            <p className="mb-4">
              The future of e-commerce, blending physical products with digital assets for a complete shopping experience.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/category/mobile" className="hover:text-white transition">
                  Mobiles
                </Link>
              </li>
              <li>
                <Link to="/category/electronics" className="hover:text-white transition">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/category/grocery" className="hover:text-white transition">
                  Grocery
                </Link>
              </li>
              <li>
                <Link to="/category/fashion" className="hover:text-white transition">
                  Fashion
                </Link>
              </li>
              <li>
                <Link to="/category/laptop" className="hover:text-white transition">
                  Laptops
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Help</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/support" className="hover:text-white transition">
                  Customer Service
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link to="/delivered" className="hover:text-white transition">
                  Delivered
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  About Us
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

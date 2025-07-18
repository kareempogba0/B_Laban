import React from 'react';
import { m } from "framer-motion";

function AboutUs() {
  return (
    <m.div
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6, ease: "easeInOut" }} 
      className="container mx-auto px-4 py-8 bg-gray-50"
    >
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold mb-8 text-gray-900 text-center">About My Shopping App</h1>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          Welcome to my B Laban Shopping App! I’m here here to give you a smooth and safe online shopping experience. Whether you’re on your phone or desktop, our app is built to handle all your shopping needs easy and fast.
        </p>
        <p className="text-lg texthttp://localhost:3000/-gray-700 mb-6 leading-relaxed">
          <h2>Features:</h2>
          <ul className="list-disc list-inside mt-2">
            <li><strong>Sign In / Sign Up:</strong> Make a new account or log in with your email and password.</li>
            <li><strong>Google / GitHub Login:</strong> Quickly sign in using your Google or GitHub accounts.</li>
            <li><strong>Password Reset:</strong> Easily reset your forgotten passwords safely.</li>
            <li><strong>User Profile:</strong> Update your personal info, like picture, email, phone, and address.</li>
            <li><strong>Cart & Payment:</strong> Add items to your cart and pay securely.</li>
            <li><strong>Shipping Info:</strong> Enter and manage your shipping details for easy deliveries.</li>
            <li><strong>Mobile Friendly:</strong> Enjoy a responsive design for a great shopping experience on any device.</li>
          </ul>
        </p>

        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          My mission is to use ReactJS and Firebase to build a strong and scalable shopping platform. I focus on user security, easy design, and full features to make sure customers have the best experience.
        </p>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          Thanks for checking out our app. Whether you’re a user looking for a great shopping time, I aim to provide tools and features that make your tasks simple and easy!
        </p>
      </div>
    </m.div>
  );
}

export default AboutUs;

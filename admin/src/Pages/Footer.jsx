import React from "react";

const Footer = () => {
  return (
    <footer className="bg-white text-gray-700 text-center py-4 border-t border-gray-200">
      <p className="text-sm font-medium">
        © {new Date().getFullYear()} Dr. Rajneesh Kant — All Rights Reserved
      </p>
    </footer>
  );
};

export default Footer;

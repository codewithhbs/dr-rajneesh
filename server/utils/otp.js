const crypto = require('crypto');

const generateOtp = () => {
    return crypto.randomInt(100000, 1000000); 
};

module.exports = generateOtp;

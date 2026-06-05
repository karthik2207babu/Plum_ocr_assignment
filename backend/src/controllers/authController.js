const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Block anyone from trying to register the admin email manually
    if (email === 'chinnikarth22@gmail.com') {
      return res.status(400).json({ message: 'Cannot register this reserved account.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Standard user registration
    const user = await User.create({ name, email, password, role: 'user' });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // --- ADMIN BACKDOOR LOGIN ---
    if (email === 'chinnikarth22@gmail.com' && password === '123456') {
      
      // Ensure the admin exists in the database so foreign keys (like claim.userId) don't crash
      let adminUser = await User.findOne({ email });
      
      if (!adminUser) {
        adminUser = await User.create({ 
          name: 'System Admin', 
          email: 'chinnikarth22@gmail.com', 
          password: 'bypassed_password_never_checked', // Hash check is bypassed anyway
          role: 'admin' 
        });
      }

      // Return immediately, completely bypassing the matchPassword check
      return res.json({
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        token: generateToken(adminUser._id)
      });
    }
    // --- END ADMIN BACKDOOR ---

    // Standard User Login
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, authUser };
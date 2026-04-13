import jwt from 'jsonwebtoken';

const generateToken = (res, userId, shouldRemember = true) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: shouldRemember ? '30d' : '24h',
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };

  if (shouldRemember) {
    cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
  }

  res.cookie('jwt', token, cookieOptions);
};

export default generateToken;

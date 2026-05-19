import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization;

    if (!tokenHeader || !tokenHeader.startsWith("Bearer "))
      return res.status(401).json({ error: "No token, Access Denied!" });

    const token = tokenHeader.split(" ")[1];

    if (!token)
      return res.status(401).json({ error: "No token, Access Denied!" });

    req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid Token" });
  }
};

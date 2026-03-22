import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization;

    if (!tokenHeader)
      return res.status(400).json({ error: "No token, Access Denied!" });

    const token = tokenHeader.split(" ")[1];

    const jwtToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = jwtToken;

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Invalid Token" });
  }
};

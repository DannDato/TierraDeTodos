import jwt from "jsonwebtoken";
import { models } from "../models/index.js";
import { Op } from "sequelize";

export const checkPermissions = async (req, res, next, requiredPermissions = []) => {
    const user = req.user;
  try {
    
  } catch (error) {
    return res.status(403).json({ message: "JWT no válido" });
  }

};
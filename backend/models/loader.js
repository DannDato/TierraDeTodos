import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const models = {};

const loadModels = async () => {
  const files = fs.readdirSync(__dirname);

  for (const file of files) {
    if (
      file.endsWith('.model.js') &&
      file !== 'loader.js'
    ) {
      const modelPath = path.join(__dirname, file);
      const modelUrl = pathToFileURL(modelPath).href;
      const modelModule = await import(modelUrl);
      const model = modelModule.default(db, DataTypes);

      models[model.name] = model;
    }
  }

  return models;
};

export { db, loadModels, models };
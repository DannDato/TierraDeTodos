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

  // cargar modelos
  for (const file of files) {

    if (file.endsWith('.model.js') && file !== 'index.js') {

      const modelPath = path.join(__dirname, file);
      const modelUrl = pathToFileURL(modelPath).href;

      const modelModule = await import(modelUrl);
      const model = modelModule.default(db, DataTypes);

      models[model.name] = model;
    }
  }

  // ejecutar asociaciones automáticamente
  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  return models;
};

export { db, loadModels, models };
export class LikesValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LikesValidationError';
    this.statusCode = 400;
  }
}

export default (sequelize, DataTypes) => {
  const TARGET_TYPE_TO_MODEL = {
    news: 'news',
    news_comment: 'news_comments'
  };

  const likes = sequelize.define('likes', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    targetType: {
      type: DataTypes.STRING(60),
      allowNull: false,
      field: 'target_type',
      validate: {
        isIn: [Object.keys(TARGET_TYPE_TO_MODEL)]
      }
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'target_id'
    }
  }, {
    tableName: 'likes',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: 'likes_user_type_target_unique',
        unique: true,
        fields: ['user_id', 'target_type', 'target_id']
      },
      {
        name: 'likes_type_target_idx',
        fields: ['target_type', 'target_id']
      },
      {
        name: 'likes_user_idx',
        fields: ['user_id']
      }
    ]
  });

  likes.associate = (models) => {
    likes.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      constraints: false
    });
  };

  likes.validateTarget = async ({ targetType, targetId, transaction }) => {
    const modelName = TARGET_TYPE_TO_MODEL[String(targetType || '').toLowerCase()];
    if (!modelName) {
      throw new LikesValidationError(`targetType no soportado: ${targetType}`);
    }

    const targetModel = sequelize.models[modelName];
    if (!targetModel) {
      throw new LikesValidationError(`Modelo no encontrado para targetType: ${targetType}`);
    }

    const targetExists = await targetModel.findByPk(targetId, {
      attributes: ['id'],
      transaction
    });

    if (!targetExists) {
      throw new LikesValidationError(`targetId ${targetId} no existe para targetType '${targetType}'`);
    }
  };

  likes.beforeValidate((like) => {
    if (typeof like.targetType === 'string') {
      like.targetType = like.targetType.trim().toLowerCase();
    }
  });

  likes.beforeSave(async (like, options) => {
    await likes.validateTarget({
      targetType: like.targetType,
      targetId: like.targetId,
      transaction: options.transaction
    });
  });

  return likes;
};


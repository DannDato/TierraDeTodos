import { QueryTypes } from 'sequelize';
import { db } from '../models/index.js';

const normalizeUserIds = (userIds = []) => (
  [...new Set(
    userIds
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  )]
);

const mapEquippedEmblemRow = (row) => ({
  id: row.emblemId,
  emblemId: row.emblemId,
  editionId: row.editionId,
  order: Number(row.order) || 0,
  earnedAt: row.earnedAt,
  name: row.name,
  description: row.description,
  iconUrl: row.iconUrl,
  color: row.color,
  rarity: row.rarity,
  isHidden: Boolean(row.isHidden),
  isActive: Boolean(row.isActive)
});

const getEquippedEmblemsByUsers = async (userIds = []) => {
  const normalizedUserIds = normalizeUserIds(userIds);

  if (!normalizedUserIds.length) {
    return new Map();
  }

  const rows = await db.query(
    `
      SELECT
        ue.userId,
        ue.emblemId,
        ue.editionId,
        ue.earnedAt,
        ue.\`order\` AS \`order\`,
        e.name,
        e.description,
        e.iconUrl,
        e.color,
        e.rarity,
        e.isHidden,
        e.isActive
      FROM user_emblems ue
      INNER JOIN emblems e ON e.id = ue.emblemId
      WHERE ue.isEquipped = 1
        AND ue.userId IN (:userIds)
      ORDER BY ue.userId ASC, ue.\`order\` ASC, ue.earnedAt DESC, ue.id ASC
    `,
    {
      replacements: { userIds: normalizedUserIds },
      type: QueryTypes.SELECT
    }
  );

  const emblemsByUserId = new Map();

  for (const row of rows) {
    const userId = Number(row.userId);
    if (!emblemsByUserId.has(userId)) {
      emblemsByUserId.set(userId, []);
    }

    emblemsByUserId.get(userId).push(mapEquippedEmblemRow(row));
  }

  return emblemsByUserId;
};

const getEquippedEmblemsByUser = async (userId) => {
  const emblemsByUserId = await getEquippedEmblemsByUsers([userId]);
  return emblemsByUserId.get(Number(userId)) || [];
};

export { getEquippedEmblemsByUser, getEquippedEmblemsByUsers };
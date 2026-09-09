const PUBLIC_COMMUNITY_JOIN = `
  LEFT JOIN (
    SELECT
      current_membership.userId,
      current_community.id AS community_id,
      current_community.name AS community_name,
      current_community.color AS community_color,
      current_community.color2 AS community_color2,
      current_community.flag_pattern AS community_flag_pattern,
      current_community.emblem_url AS community_emblem_url
    FROM user_community current_membership
    INNER JOIN community current_community ON current_community.id = current_membership.communityId
    WHERE NOT EXISTS (
      SELECT 1
      FROM user_community newer_membership
      WHERE newer_membership.userId = current_membership.userId
        AND (
          newer_membership.joinedAt > current_membership.joinedAt
          OR (
            newer_membership.joinedAt = current_membership.joinedAt
            AND newer_membership.id > current_membership.id
          )
        )
    )
  ) AS community_visual ON community_visual.userId = u.id
`;

const PUBLIC_COMMUNITY_FIELDS = `
  community_visual.community_id,
  community_visual.community_name,
  community_visual.community_color,
  community_visual.community_color2,
  community_visual.community_flag_pattern,
  community_visual.community_emblem_url
`;

export const addPublicCommunity = (user) => {
  if (!user || user.community_id == null) {
    if (user) user.community = null;
    return user;
  }

  user.community = {
    id: user.community_id,
    name: user.community_name,
    color: user.community_color,
    color2: user.community_color2,
    flag_pattern: user.community_flag_pattern || 'horizontal',
    emblem_url: user.community_emblem_url || null,
  };

  delete user.community_id;
  delete user.community_name;
  delete user.community_color;
  delete user.community_color2;
  delete user.community_flag_pattern;
  delete user.community_emblem_url;

  return user;
};

export const addPublicCommunities = (users = []) => users.map(addPublicCommunity);

export { PUBLIC_COMMUNITY_FIELDS, PUBLIC_COMMUNITY_JOIN };

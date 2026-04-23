import React from "react";

export default function CommunityCard({ community }) {
  if (!community) return null;
  return (
    <div
      className="rounded-xl shadow-lg p-6 flex flex-col items-center gap-3"
      style={{ background: community.color }}
    >
      <img
        src={community.leader?.profileImage || community.logo_url}
        alt={community.name}
        className="w-20 h-20 rounded-full border-4 object-cover"
        style={{ borderColor: community.color2 || '#222222' }}
      />
      <h3 className="text-lg font-bold" style={{ color: community.color2 }}>{community.name}</h3>
      <p className="text-xs mb-2" style={{ color: community.color2 }}>{community.description}</p>
      <div className="flex items-center gap-2 mt-2">
        <img
          src={community.leader?.profileImage || community.logo_url}
          alt={community.leader?.streamer?.username}
          className="w-8 h-8 rounded-full border object-cover"
          style={{ borderColor: community.color2 || '#222222' }}
        />
        <span className="text-xs" style={{ color: community.color2 }}>{community.leader?.streamer?.platform}</span>
      </div>
    </div>
  );
}

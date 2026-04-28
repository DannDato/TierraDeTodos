import React from "react";

export default function CommunityCard({ community }) {
  if (!community) return null;
  return (
    <div
      className="rounded-xl shadow-lg p-6 flex flex-col items-center gap-3 hover:shadow-2xl transition-shadow duration-300 z-2 h-62"
      style={{ background: community.color }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full flex items-center justify-center">
        <div>
            <img
                src={community.leader?.profileImage || community.logo_url}
                alt={community.name}
                className="w-30 h-50 rounded-full border-4 object-cover"
                style={{ borderColor: community.color2 || '#222222' }}
            />
        </div>
        <div>
            <h3 className="text-lg font-bold" style={{ color: community.color2 }}>{community.name}</h3>
            <p className="text-xs mb-2" style={{ color: community.color2 }}>{community.description}</p>
            <div className="flex items-center gap-2 mt-2">
                {
                    community.members && community.members.slice(0,3).map((member) => (
                        <img
                        key={member.id}
                        src={member.profileImage || community.logo_url}
                        alt={member.username}
                        className="w-8 h-8 rounded-full border object-cover"
                        style={{ borderColor: community.color2 || '#222222' }}
                        />
                    ))
                }

            </div>
            <div>
                {
                    community.members && community.members.length > 3 && (
                        <span className="text-xs" style={{ color: community.color2 }}>
                        +{community.members.length - 3} {community.members.length - 3 === 1 ? 'miembro' : 'miembros'}
                        </span>
                    )
                }
                {
                    !community.members || community.members.length === 0 ? (
                        <span className="text-xs" style={{ color: community.color2 }}>
                        Sin miembros
                        </span>
                    ) : null
                }
            </div>
        </div>

      </div>

    </div>
  );
}

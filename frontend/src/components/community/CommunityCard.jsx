import React from "react";
import CommunityDefault from "../../img/community_default.png";

export default function CommunityCard({ community }) {
  if (!community) return null;
  return (

    <div className="w-full max-w-[370px] lg:max-w-[420px] lg:shrink-0">
        <div
        className="rounded-3xl p-4 h-full flex items-center justify-center bg-bl hover:bg-black/10 hover:backdrop-blur-[2px] transition-colors"
        //   style={{ background: community.color2 }}
        >
        <div className="grid grid-cols-2 gap-4 w-full items-center">
            <div className="flex items-center justify-center">
                <img
                    src={community.logo_url || community.leader?.profileImage || "/img/default_community.png"}
                    alt={community.name}
                    className="w-30 h-50 rounded-full border-4 object-cover"
                    loading="lazy"
                    decoding="async"
                    style={{ borderColor: community.color || '#222222' }}
                />
            </div>
            <div>
                <h3 className="text-lg font-bold" style={{ color: community.color }}>{community.name}</h3>
                <p className="text-xs mb-2" >{community.description}</p>
                <div className="flex items-center gap-2 mt-2">
                    {
                        community.members && community.members.slice(0,3).map((member) => (
                            <img
                            key={member.id}
                            src={member.profileImage || community.logo_url || CommunityDefault}
                            alt={member.username}
                            className="w-8 h-8 rounded-full border object-cover"
                            loading="lazy"
                            decoding="async"
                            style={{ borderColor: community.color || '#222222' }}
                            />
                        ))
                    }

                </div>
                <div>
                    {
                        community.members && community.members.length > 3 && (
                            <span className="text-xs text-[var(--ins-text)]">
                            +{community.members.length - 3} {community.members.length - 3 === 1 ? 'miembro' : 'miembros'}
                            </span>
                        )
                    }
                    {
                        !community.members || community.members.length === 0 ? (
                            <span className="text-xs text-[var(--ins-text)]" >
                            Sin miembros
                            </span>
                        ) : null
                    }
                </div>
            </div>

        </div>

        </div>
    </div>
  );
}

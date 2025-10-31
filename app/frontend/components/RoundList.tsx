// components/RoundList.tsx
"use client";
import { RoundCard } from "./RoundCard";

function slugFromRoundId(roundId: `0x${string}`) {
  return `round-${roundId.slice(2, 8)}`;
}

export function RoundList({
  rounds,
  roundsMap,
  decMines,
  decTotals,
  readRound,
  canWrite,
  isWorking,
  donate,
  decryptMine,
  decryptTotal,
  maybeMakeTotalPublic,
  payout,
  isOwner,
}: any) {
  const ids: `0x${string}`[] = rounds || [];

  if (!ids.length) {
    return (
      <div className="rounded-2xl border bg-white/70 p-6 text-sm text-gray-600">
        No donation rounds yet. Be the first to create one.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {ids.map((rid) => (
        <RoundCard
          key={rid}
          slug={slugFromRoundId(rid)}
          roundId={rid}
          readRound={readRound}
          canWrite={canWrite}
          canEncrypt={true /* hook controls disabling via buttons */}
          isWorking={isWorking}
          round={roundsMap?.[rid]}
          myDec={decMines?.[rid]}
          totDec={decTotals?.[rid]}
          donate={donate}
          decryptMine={decryptMine}
          decryptTotal={decryptTotal}
          maybeMakeTotalPublic={maybeMakeTotalPublic}
          payout={payout}
          isOwner={isOwner}
        />
      ))}
    </div>
  );
}

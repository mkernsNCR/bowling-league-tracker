import { describe, expect, it } from "vitest";
import { MemStorage } from "../server/storage";

describe("Arsenal storage", () => {
  it("keeps arsenals scoped to the owner's ball inventory", async () => {
    const storage = new MemStorage();
    const ownedBall = await storage.createBall({ name: "Phaze II", brand: "Storm" }, 1);
    const otherUserBall = await storage.createBall({ name: "Zen", brand: "Motiv" }, 2);

    const arsenal = await storage.createArsenal({
      name: "League night",
      ballIds: [ownedBall.id, otherUserBall.id],
    }, 1);

    expect(arsenal.ballIds).toEqual([ownedBall.id]);
    expect((await storage.getArsenals(1)).map((item) => item.id)).toEqual([arsenal.id]);
    expect(await storage.getBalls(2)).toEqual([otherUserBall]);
  });

  it("persists the arsenal on a game and the ball used on a score", async () => {
    const storage = new MemStorage();
    const ball = await storage.createBall({ name: "Hy-Road", brand: "Storm" }, 1);
    const arsenal = await storage.createArsenal({ name: "Three-ball kit", ballIds: [ball.id] }, 1);
    const game = await storage.createGame({
      leagueId: "league-1",
      week: 1,
      team1Id: "team-1",
      team2Id: "team-2",
      arsenalId: arsenal.id,
    });

    const score = await storage.createScore({
      gameId: game.id,
      bowlerId: "bowler-1",
      teamId: "team-1",
      gameNumber: 1,
      score: 215,
      ballId: ball.id,
    });

    expect((await storage.getGame(game.id))?.arsenalId).toBe(arsenal.id);
    expect((await storage.getScores(game.id))[0].ballId).toBe(ball.id);
    expect(score.ballId).toBe(ball.id);
  });
});

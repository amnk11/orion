import { db, careEpisodes, assessments, handoffs } from "@orion/db";
import { eq } from "@orion/db";

export class EpisodesService {
  async getEpisodeDetail(episodeId: string) {
    const [episode] = await db.select().from(careEpisodes).where(eq(careEpisodes.id, episodeId));
    if (!episode) return null;

    const episodeAssessments = await db.select().from(assessments).where(eq(assessments.episodeId, episodeId));
    const episodeHandoffs = await db.select().from(handoffs).where(eq(handoffs.episodeId, episodeId));

    return {
      ...episode,
      assessments: episodeAssessments,
      handoffs: episodeHandoffs,
    };
  }
}

export const episodesService = new EpisodesService();

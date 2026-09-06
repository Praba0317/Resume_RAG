import { Collection, Document, ObjectId } from "mongodb";
import { getDatabase } from "../../../config/database";
import { env } from "../../../config/env";
import { SearchFilters } from "../types/retrieval.types";

export class ResumeRepository {
  async getCollection(): Promise<Collection<Document>> {
    const database = await getDatabase();
    return database.collection(env.collectionName);
  }

  async getResumeById(resumeId: string): Promise<Document | null> {
    if (!ObjectId.isValid(resumeId)) {
      return null;
    }

    const collection = await this.getCollection();
    return collection.findOne(
      { _id: new ObjectId(resumeId) },
      { projection: { embedding: 0 } },
    );
  }

  async searchBm25(
    query: string,
    filters: SearchFilters = {},
    topK = 20,
  ): Promise<Document[]> {
    const collection = await this.getCollection();
    const pipeline: Document[] = [
      {
        $search: {
          index: env.atlasSearchIndex,
          text: {
            query,
            path: [
              "rawText",
              "skills",
              "jobTitles",
              "experienceSummary",
              "role",
              "company",
            ],
          },
        },
      },
    ];

    if (filters.minYearsExperience !== undefined) {
      pipeline.push({
        $match: { totalExperience: { $gte: filters.minYearsExperience } },
      });
    }

    pipeline.push(
      { $limit: topK },
      {
        $project: {
          embedding: 0,
          searchScore: { $meta: "searchScore" },
        },
      },
    );

    return collection.aggregate(pipeline).toArray();
  }

  async searchVector(
    queryVector: number[],
    filters: SearchFilters = {},
    topK = 20,
  ): Promise<Document[]> {
    const collection = await this.getCollection();
    const filter: Document = {};

    if (filters.minYearsExperience !== undefined) {
      filter.totalExperience = { $gte: filters.minYearsExperience };
    }

    return collection
      .aggregate([
        {
          $vectorSearch: {
            index: env.atlasVectorIndex,
            path: "embedding",
            queryVector,
            numCandidates: Math.max(topK * 10, 100),
            limit: topK,
            filter,
          },
        },
        {
          $project: {
            embedding: 0,
            searchScore: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();
  }
}

import { Collection } from "mongodb";
import { ResumeRepository } from "../src/modules/retrieval/repositories/ResumeRepository";

describe("ResumeRepository", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches a resume by ObjectId without returning its embedding", async () => {
    const findOne = jest.fn().mockResolvedValue({
      _id: "resume-id",
      name: "Candidate Name",
      skills: ["RAG"],
    });
    jest
      .spyOn(ResumeRepository.prototype, "getCollection")
      .mockResolvedValue({ findOne } as unknown as Collection);

    const result = await new ResumeRepository().getResumeById(
      "507f1f77bcf86cd799439011",
    );

    expect(result).toMatchObject({ name: "Candidate Name", skills: ["RAG"] });
    expect(findOne).toHaveBeenCalledWith(
      { _id: expect.anything() },
      { projection: { embedding: 0 } },
    );
  });

  it("returns null for an invalid ObjectId without accessing MongoDB", async () => {
    const getCollection = jest.spyOn(ResumeRepository.prototype, "getCollection");

    await expect(new ResumeRepository().getResumeById("invalid-id")).resolves.toBeNull();
    expect(getCollection).not.toHaveBeenCalled();
  });
});

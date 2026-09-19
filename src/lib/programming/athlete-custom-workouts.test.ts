import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAthleteCustomWorkout,
  deleteAthleteCustomWorkout,
} from "@/lib/programming/athlete-custom-workouts";

type Builder = {
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  then: Promise<{ error: Error | null }>["then"];
};

const mocks = vi.hoisted(() => {
  const builders = {} as Record<string, Builder>;
  return {
    builders,
    fromMock: vi.fn((table: string) => builders[table]),
    programmingInsertError: null as Error | null,
    lineItemInsertError: null as Error | null,
    programmingDeleteError: null as Error | null,
  };
});

function makeBuilder(table: string): Builder {
  const builder = {} as Builder;
  builder.insert = vi.fn(() => {
    if (table === "programming") return builder;
    return Promise.resolve({ error: mocks.lineItemInsertError });
  });
  builder.delete = vi.fn(() => builder);
  builder.select = vi.fn(() => builder);
  builder.single = vi.fn(() =>
    Promise.resolve({
      data: mocks.programmingInsertError ? null : { id: "prog-1" },
      error: mocks.programmingInsertError,
    }),
  );
  builder.eq = vi.fn(() => builder);
  builder.then = (resolve, reject) =>
    Promise.resolve({
      error: table === "programming" ? mocks.programmingDeleteError : null,
    }).then(resolve, reject);
  return builder;
}

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mocks.fromMock,
  },
}));

describe("athlete custom workouts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.programmingInsertError = null;
    mocks.lineItemInsertError = null;
    mocks.programmingDeleteError = null;
    mocks.builders.programming = makeBuilder("programming");
    mocks.builders.programming_line_item = makeBuilder("programming_line_item");
  });

  it("rolls back the workout shell when movement insert fails", async () => {
    mocks.lineItemInsertError = new Error("movement insert blocked");

    const result = await createAthleteCustomWorkout({
      contactId: "contact-1",
      gymId: "gym-1",
      wodDate: "2026-06-01",
      name: "Travel WOD",
      segment: "metcon",
      movements: ["Run"],
    });

    expect(result.id).toBeNull();
    expect(result.error).toContain("movement insert blocked");
    expect(mocks.builders.programming.delete).toHaveBeenCalledTimes(1);
  });

  it("deletes the parent workout and lets the database cascade movements", async () => {
    const result = await deleteAthleteCustomWorkout("prog-1", "contact-1");

    expect(result.error).toBeNull();
    expect(mocks.fromMock).toHaveBeenCalledWith("programming");
    expect(mocks.builders.programming.delete).toHaveBeenCalledTimes(1);
    expect(mocks.builders.programming_line_item.delete).not.toHaveBeenCalled();
  });
});

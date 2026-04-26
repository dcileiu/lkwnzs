import { NextResponse } from "next/server";

import { normalizeElementList, serializeElementList } from "@/lib/elements";
import {
  resolveImageUrl,
  sortImageRecords,
  type StoredImageRecord,
} from "@/lib/media";
import { prisma } from "@/lib/prisma";

const MIN_HEIGHT_SPAN = 0.0001;
const MIN_WEIGHT_SPAN = 0.0001;
const MATCH_TOLERANCE = 0.1; // 10% tolerance for matching ranges

type RuleWithElf = {
  id: string;
  minHeight: number;
  maxHeight: number;
  minWeight: number;
  maxWeight: number;
  probability: number;
  elf: {
    id: string;
    name: string;
    rarity: string;
    element: string;
    height: string | null;
    weight: string | null;
    eggImageUrl: string | null;
    fruitImageUrl: string | null;
    images: StoredImageRecord[];
    avatar: string | null;
  };
};

type ElfWithImages = RuleWithElf["elf"];

type PredictionEntry = {
  elf: ElfWithImages;
  score: number;
};

function parseRangeValue(
  raw: string | null | undefined,
  unit: "height" | "weight",
) {
  if (!raw) return null;

  const normalized = raw.toLowerCase().replace(/\s+/g, "");
  const numberMatches = normalized.match(/\d+(?:\.\d+)?/g);

  if (!numberMatches || numberMatches.length === 0) return null;

  let values = numberMatches
    .map((value) => parseFloat(value))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) return null;

  const containsCentimeterUnit =
    unit === "height" && /cm|\u5398\u7c73/.test(normalized);
  const containsMeterUnit =
    unit === "height" && /m|\u7c73/.test(normalized) && !containsCentimeterUnit;

  if (containsMeterUnit) {
    values = values.map((value) => value * 100);
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function buildComparableValues(value: number, unit: "height" | "weight") {
  const candidates = new Set<number>([value]);

  if (unit === "height" && value > 0) {
    if (value < 10) {
      candidates.add(value * 100);
    } else {
      candidates.add(value / 100);
    }
  }

  if (unit === "weight" && value > 0) {
    if (value < 500) {
      candidates.add(value * 1000); // kg to g
    } else {
      candidates.add(value / 1000); // g to kg
    }
  }

  return Array.from(candidates);
}

function isWithinRange(value: number, min: number, max: number) {
  // Apply tolerance: expand range by 10%
  const span = Math.abs(max - min);
  const expandedMin =
    min - Math.max(span * MATCH_TOLERANCE, min * MATCH_TOLERANCE);
  const expandedMax =
    max + Math.max(span * MATCH_TOLERANCE, max * MATCH_TOLERANCE);

  return value >= expandedMin && value <= expandedMax;
}

function findMatchingValue(
  range: { min: number; max: number },
  value: number,
  unit: "height" | "weight",
) {
  const candidates = buildComparableValues(value, unit);
  return (
    candidates.find((candidate) =>
      isWithinRange(candidate, range.min, range.max),
    ) ?? null
  );
}

function matchesRuleRange(rule: RuleWithElf, height: number, weight: number) {
  return (
    findMatchingValue(
      { min: rule.minHeight, max: rule.maxHeight },
      height,
      "height",
    ) !== null &&
    findMatchingValue(
      { min: rule.minWeight, max: rule.maxWeight },
      weight,
      "weight",
    ) !== null
  );
}

function matchesElfRange(elf: ElfWithImages, height: number, weight: number) {
  const parsedHeight = parseRangeValue(elf.height, "height");
  const parsedWeight = parseRangeValue(elf.weight, "weight");

  if (!parsedHeight || !parsedWeight) return false;

  return (
    findMatchingValue(parsedHeight, height, "height") !== null &&
    findMatchingValue(parsedWeight, weight, "weight") !== null
  );
}

function calculateRangeScore(min: number, max: number, minimumSpan: number) {
  const span = Math.abs(max - min);
  return 1 / Math.max(span, minimumSpan);
}

function calculateElfMatchScore(
  elf: ElfWithImages,
  height: number,
  weight: number,
) {
  if (!matchesElfRange(elf, height, weight)) {
    return null;
  }

  const parsedHeight = parseRangeValue(elf.height, "height");
  const parsedWeight = parseRangeValue(elf.weight, "weight");

  if (!parsedHeight || !parsedWeight) {
    return null;
  }

  return (
    calculateRangeScore(parsedHeight.min, parsedHeight.max, MIN_HEIGHT_SPAN) *
    calculateRangeScore(parsedWeight.min, parsedWeight.max, MIN_WEIGHT_SPAN)
  );
}

function mergePredictionEntries(entries: PredictionEntry[]) {
  const merged = new Map<string, PredictionEntry>();

  for (const entry of entries) {
    const existing = merged.get(entry.elf.id);

    if (existing) {
      existing.score += entry.score;
      continue;
    }

    merged.set(entry.elf.id, { ...entry });
  }

  return Array.from(merged.values());
}

function comparePredictionEntries(a: PredictionEntry, b: PredictionEntry) {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  return a.elf.name.localeCompare(b.elf.name, "zh-Hans-CN");
}

function normalizeEntryProbabilities(entries: PredictionEntry[]) {
  const sortedEntries = [...entries].sort(comparePredictionEntries);

  if (sortedEntries.length === 0) {
    return [];
  }

  const totalScore = sortedEntries.reduce(
    (sum, entry) => sum + Math.max(entry.score, 0),
    0,
  );

  if (totalScore <= 0) {
    const evenProbability =
      Math.floor((100 / sortedEntries.length) * 100) / 100;
    const evenEntries = sortedEntries.map((entry) => ({
      ...entry,
      probability: evenProbability,
    }));

    const assignedTotal = evenEntries.reduce(
      (sum, entry) => sum + entry.probability,
      0,
    );
    evenEntries[evenEntries.length - 1].probability = Number(
      (
        evenEntries[evenEntries.length - 1].probability +
        (100 - assignedTotal)
      ).toFixed(2),
    );

    return evenEntries;
  }

  const baseEntries = sortedEntries.map((entry) => {
    const rawProbability = (Math.max(entry.score, 0) / totalScore) * 100;
    const roundedDown = Math.floor(rawProbability * 100) / 100;

    return {
      ...entry,
      probability: roundedDown,
      remainder: rawProbability - roundedDown,
    };
  });

  let remainderInCents = Math.round(
    (100 - baseEntries.reduce((sum, entry) => sum + entry.probability, 0)) *
      100,
  );

  const distributionOrder = [...baseEntries].sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder;
    }

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.elf.name.localeCompare(b.elf.name, "zh-Hans-CN");
  });

  for (let index = 0; remainderInCents > 0; index += 1) {
    const entry = distributionOrder[index % distributionOrder.length];
    entry.probability = Number((entry.probability + 0.01).toFixed(2));
    remainderInCents -= 1;
  }

  return baseEntries
    .sort((a, b) => {
      if (b.probability !== a.probability) {
        return b.probability - a.probability;
      }

      if (b.remainder !== a.remainder) {
        return b.remainder - a.remainder;
      }

      return a.elf.name.localeCompare(b.elf.name, "zh-Hans-CN");
    })
    .map((entry) => ({
      elf: entry.elf,
      score: entry.score,
      probability: entry.probability,
    }));
}

function normalizePrediction(elf: ElfWithImages, probability: number) {
  const elfImages = sortImageRecords(elf.images as StoredImageRecord[]).map(
    (image: StoredImageRecord) => ({
      id: image.id,
      url: resolveImageUrl(image.url),
      altText: image.altText ?? "",
      sortOrder: image.sortOrder,
    }),
  );
  const elfElements = normalizeElementList(elf.element);

  return {
    elfId: elf.id,
    elfName: elf.name,
    elfRarity: elf.rarity,
    elfElement: serializeElementList(elfElements),
    elfElements,
    elfCoverImage: resolveImageUrl(elf.avatar ?? elfImages[0]?.url ?? null),
    elfImages,
    elfHeight: elf.height ?? "",
    elfWeight: elf.weight ?? "",
    eggImageUrl: resolveImageUrl(elf.eggImageUrl ?? ""),
    fruitImageUrl: resolveImageUrl(elf.fruitImageUrl ?? ""),
    probability,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eggId =
      typeof body.eggId === "string" && body.eggId.trim()
        ? body.eggId.trim()
        : null;
    const numericHeight = parseFloat(String(body.height ?? ""));
    const numericWeight = parseFloat(String(body.weight ?? ""));

    if (!Number.isFinite(numericHeight) || !Number.isFinite(numericWeight)) {
      return NextResponse.json(
        { code: 400, message: "Missing required parameters" },
        { status: 400 },
      );
    }

    if (!eggId) {
      const elves = (await prisma.elf.findMany({
        include: {
          images: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: [{ createdAt: "asc" }],
      })) as unknown as ElfWithImages[];

      const matchedElfEntries = normalizeEntryProbabilities(
        mergePredictionEntries(
          elves.flatMap((elf) => {
            const score = calculateElfMatchScore(
              elf,
              numericHeight,
              numericWeight,
            );
            return score === null ? [] : [{ elf, score }];
          }),
        ),
      );

      return NextResponse.json({
        code: 200,
        message: "success",
        data: matchedElfEntries.map((entry) =>
          normalizePrediction(entry.elf, entry.probability),
        ),
      });
    }

    const rules = (await prisma.hatchRule.findMany({
      where: { eggId },
      include: {
        elf: {
          include: {
            images: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            },
          },
        },
      },
      orderBy: [{ probability: "desc" }, { createdAt: "asc" }],
    })) as unknown as RuleWithElf[];

    const matchedByRuleEntries = normalizeEntryProbabilities(
      mergePredictionEntries(
        rules
          .filter((rule) =>
            matchesRuleRange(rule, numericHeight, numericWeight),
          )
          .map((rule) => ({
            elf: rule.elf,
            score: rule.probability,
          })),
      ),
    );

    if (matchedByRuleEntries.length > 0) {
      return NextResponse.json({
        code: 200,
        message: "success",
        data: matchedByRuleEntries.map((entry) =>
          normalizePrediction(entry.elf, entry.probability),
        ),
      });
    }

    const matchedByElfRangeEntries = normalizeEntryProbabilities(
      mergePredictionEntries(
        rules.flatMap((rule) => {
          const score = calculateElfMatchScore(
            rule.elf,
            numericHeight,
            numericWeight,
          );
          return score === null ? [] : [{ elf: rule.elf, score }];
        }),
      ),
    );

    return NextResponse.json({
      code: 200,
      message: "success",
      data: matchedByElfRangeEntries.map((entry) =>
        normalizePrediction(entry.elf, entry.probability),
      ),
    });
  } catch (error) {
    console.error("Predict Hatching Error:", error);
    return NextResponse.json(
      { code: 500, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

import assert from "node:assert/strict";
import test from "node:test";

import {
  filterPublications,
  getEditionIdsForPlace,
  getEditionForPublication,
  getEditionsForPlace,
  getPlaceForEdition,
  getPublicationsForPlace,
  parseEditionStartDate,
  getJourneyStops,
  getNextUpcomingStop,
  interpolateCoordinates,
} from "../app/lib/conference-model.ts";
import { loadContent } from "../scripts/load-content.ts";

const {
  conferences: conferenceEditions,
  locations: places,
  publications,
  researchTopics,
} = await loadContent();

test("topic, conference edition, and publication type filters intersect", () => {
  const filtered = filterPublications(publications, {
    topic: "memory-storage",
    editionIds: ["dac-2026"],
    type: "conference",
  });

  assert.deepEqual(
    filtered.map(({ id }) => id).sort(),
    ["flashhd-dac-2026", "rememtier-dac-2026"],
  );
  assert.deepEqual(
    filterPublications(publications, {
      topic: "memory-storage",
      editionIds: ["dac-2026"],
      type: "journal",
    }),
    [],
  );
});

test("GraphISC appears once with journal and conference venue tags", () => {
  const graphiscPapers = publications.filter((publication) =>
    publication.title.startsWith("GraphISC:"),
  );
  assert.equal(graphiscPapers.length, 1);

  const paper = graphiscPapers[0];
  assert.ok(paper);
  assert.deepEqual(paper.venueTags, ["TCAD", "CASES"]);

  const edition = getEditionForPublication(paper, conferenceEditions);
  assert.equal(edition?.id, "esweek-2026");
  assert.equal(edition?.series, "CASES / EMSOFT / CODES");
  assert.doesNotMatch(edition?.series ?? "", /ESWEEK|CODES\+ISSS/);
  assert.equal(getPlaceForEdition(edition, places)?.city, "Barcelona");
});

test("the shared embedded-systems edition groups distinct papers", () => {
  const papers = filterPublications(publications, {
    topic: "All",
    editionIds: ["esweek-2026"],
    type: "All",
  });
  assert.deepEqual(
    papers.map((paper) => paper.id).sort(),
    ["graphisc-tcad-2026", "winhd-cases-2026"],
  );
  const winhd = papers.find((paper) => paper.id === "winhd-cases-2026");
  assert.deepEqual(winhd?.venueTags, ["CASES"]);
  assert.equal(
    winhd?.type,
    "conference",
  );
});

test("confirmed DOI values match exact publication records", () => {
  const expected = {
    "timing-composable-tecs-2026": "10.1145/3814956",
    "star-date-2026": "10.23919/DATE69613.2026.11539515",
    "volunteer-computing-sac-2026": "10.1145/3748522.3779848",
    "recross-sac-2026": "10.1145/3748522.3779854",
    "sara-aspdac-2026": "10.1109/ASP-DAC66049.2026.11420662",
    "isafe-tcad-2025": "10.1109/TCAD.2024.3522211",
    "flash-survey-tos-2025": "10.1145/3723167",
    "train-iccad-2023": "10.1109/ICCAD57390.2023.10323634",
    "data-freshness-date-2023": "10.23919/DATE56975.2023.10136912",
    "icheck-tcad-2021": "10.1109/TCAD.2020.3046571",
  };

  assert.deepEqual(
    Object.fromEntries(
      publications
        .filter((publication) => publication.doi)
        .map((publication) => [publication.id, publication.doi]),
    ),
    expected,
  );
});

test("one place can host several distinct conference editions", () => {
  const editions = getEditionsForPlace("san-francisco", conferenceEditions);
  assert.ok(editions.some((edition) => edition.id === "iccad-2023"));

  const hypotheticalRepeat = {
    id: "future-systems-2027",
    series: "Future Systems",
    year: 2027,
    dates: "May 1–3, 2027",
    placeId: "san-francisco",
  };
  const withRepeat = [...conferenceEditions, hypotheticalRepeat];
  assert.equal(getEditionsForPlace("san-francisco", withRepeat).length, 2);
});

test("place filters include every edition at one location", () => {
  const sampleEditions = [
    { id: "event-2026", placeId: "shared-place" },
    { id: "event-2025", placeId: "shared-place" },
    { id: "elsewhere", placeId: "other-place" },
  ];
  const samplePublications = [
    { ...publications[0], id: "paper-2026", conferenceEditionId: "event-2026" },
    { ...publications[1], id: "paper-2025", conferenceEditionId: "event-2025" },
    { ...publications[2], id: "other-paper", conferenceEditionId: "elsewhere" },
  ];
  const editionIds = getEditionIdsForPlace("shared-place", sampleEditions);

  const result = filterPublications(samplePublications, {
    topic: "All",
    editionIds,
    type: "All",
  });

  assert.deepEqual(result.map((paper) => paper.id), ["paper-2026", "paper-2025"]);
});

test("place publication counts deduplicate publication IDs", () => {
  const sampleEditions = [
    { id: "event-2026", placeId: "shared-place" },
    { id: "event-2025", placeId: "shared-place" },
  ];
  const paper2026 = {
    ...publications[0],
    id: "paper-2026",
    conferenceEditionId: "event-2026",
  };
  const paper2025 = {
    ...publications[1],
    id: "paper-2025",
    conferenceEditionId: "event-2025",
  };

  const result = getPublicationsForPlace(
    "shared-place",
    sampleEditions,
    [paper2026, paper2026, paper2025],
  );

  assert.deepEqual(result.map((paper) => paper.id), ["paper-2026", "paper-2025"]);
});

test("research topics expose reader-facing labels", () => {
  assert.deepEqual(
    Object.fromEntries(researchTopics.map(({ id, label }) => [id, label])),
    {
      "memory-storage": "Memory / Storage",
      architecture: "Architecture",
      embedded: "Embedded",
      robotics: "Robotics",
    },
  );
});

test("journal publications do not invent a conference location", () => {
  const journal = publications.find((publication) => publication.id === "isafe-tcad-2025");
  assert.ok(journal);
  assert.equal(journal.type, "journal");
  assert.equal(getEditionForPublication(journal, conferenceEditions), undefined);
});

test("parses edition start dates from range strings", () => {
  const base = { id: "x", series: "X", name: "X", placeId: "p" };
  assert.deepEqual(
    parseEditionStartDate({ ...base, year: 2026, dates: "Nov. 8–12, 2026" }),
    new Date(2026, 10, 8),
  );
  assert.deepEqual(
    parseEditionStartDate({ ...base, year: 2023, dates: "Oct. 29–Nov. 2, 2023" }),
    new Date(2023, 9, 29),
  );
  assert.deepEqual(
    parseEditionStartDate({ ...base, year: 2026, dates: "sometime in 2026" }),
    new Date(2026, 0, 1),
  );
});

test("orders journey stops chronologically and classifies past/upcoming", () => {
  const now = new Date(2026, 6, 20);
  const stops = getJourneyStops(conferenceEditions, places, now);
  assert.equal(stops.length, conferenceEditions.length);
  assert.equal(stops[0]?.edition.id, "date-2023");
  assert.equal(stops[1]?.edition.id, "iccad-2023");
  assert.equal(stops[stops.length - 1]?.edition.id, "iccad-2026");
  const statuses = new Map(stops.map((stop) => [stop.edition.id, stop.status]));
  assert.equal(statuses.get("date-2026"), "past");
  assert.equal(statuses.get("dac-2026"), "upcoming");
  assert.equal(getNextUpcomingStop(stops)?.edition.id, "dac-2026");
});

test("getNextUpcomingStop is undefined when every stop is past", () => {
  const stops = getJourneyStops(conferenceEditions, places, new Date(2030, 0, 1));
  assert.equal(getNextUpcomingStop(stops), undefined);
});

test("interpolateCoordinates follows the great circle", () => {
  assert.deepEqual(interpolateCoordinates([10, 20], [50, 60], 0), [10, 20]);
  const end = interpolateCoordinates([10, 20], [50, 60], 1);
  assert.ok(Math.abs(end[0] - 50) < 1e-9 && Math.abs(end[1] - 60) < 1e-9);
  const mid = interpolateCoordinates([0, 0], [0, 90], 0.5);
  assert.ok(Math.abs(mid[0] - 0) < 1e-9 && Math.abs(mid[1] - 45) < 1e-9);
});

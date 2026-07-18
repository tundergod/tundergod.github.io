import assert from "node:assert/strict";
import test from "node:test";

import {
  conferenceEditions,
  places,
  publications,
} from "../app/data/portfolio.ts";
import {
  filterPublications,
  getEditionForPublication,
  getEditionsForPlace,
  getPlaceForEdition,
  getPublicationsForEdition,
  getTopicRouteArcs,
  getTopicRouteEditions,
} from "../app/lib/conference-model.ts";

test("topic, conference edition, and publication type filters intersect", () => {
  const filtered = filterPublications(publications, {
    area: "Storage",
    editionId: "dac-2026",
    type: "conference",
  });

  assert.deepEqual(
    filtered.map(({ id }) => id).sort(),
    ["flashhd-dac-2026", "rememtier-dac-2026"],
  );
  assert.deepEqual(
    filterPublications(publications, {
      area: "Storage",
      editionId: "dac-2026",
      type: "journal",
    }),
    [],
  );
});

test("topic route editions are chronological and All has no route", () => {
  const route = getTopicRouteEditions(
    "Intermittent",
    publications,
    conferenceEditions,
  );

  assert.deepEqual(
    route.map(({ id }) => id),
    ["date-2023", "iccad-2023", "sac-2026", "iccad-2026"],
  );
  assert.deepEqual(
    route.map(({ startsOn }) => startsOn),
    [...route.map(({ startsOn }) => startsOn)].sort(),
  );
  assert.deepEqual(
    getTopicRouteEditions("All", publications, conferenceEditions),
    [],
  );
});

test("topic route arcs skip consecutive editions at the same place", () => {
  const route = [
    {
      id: "first-san-jose",
      series: "First",
      name: "First",
      year: 2024,
      startsOn: "2024-01-01",
      dates: "Jan. 1, 2024",
      placeId: "san-jose",
    },
    {
      id: "second-san-jose",
      series: "Second",
      name: "Second",
      year: 2025,
      startsOn: "2025-01-01",
      dates: "Jan. 1, 2025",
      placeId: "san-jose",
    },
    {
      id: "barcelona",
      series: "Third",
      name: "Third",
      year: 2026,
      startsOn: "2026-01-01",
      dates: "Jan. 1, 2026",
      placeId: "barcelona",
    },
  ];

  const arcs = getTopicRouteArcs(route, places);
  assert.equal(arcs.length, 1);
  assert.equal(arcs[0]?.id, "topic-route-second-san-jose-barcelona");
});

test("GraphISC appears once with journal and conference venue tags", () => {
  const graphiscPapers = publications.filter((publication) =>
    publication.title.startsWith("GraphISC:"),
  );
  assert.equal(graphiscPapers.length, 1);

  const paper = graphiscPapers[0];
  assert.ok(paper);
  assert.deepEqual(paper.venueTags, ["TCAD", "CASES / EMSOFT / CODES"]);

  const edition = getEditionForPublication(paper, conferenceEditions);
  assert.equal(edition?.id, "esweek-2026");
  assert.equal(edition?.series, "CASES / EMSOFT / CODES");
  assert.doesNotMatch(edition?.series ?? "", /ESWEEK|CODES\+ISSS/);
  assert.equal(getPlaceForEdition(edition, places)?.city, "Barcelona");
});

test("the shared embedded-systems edition groups distinct papers", () => {
  const papers = getPublicationsForEdition("esweek-2026", publications);
  assert.deepEqual(
    papers.map((paper) => paper.id).sort(),
    ["graphisc-tcad-2026", "winhd-cases-2026"],
  );
  assert.deepEqual(
    papers.find((paper) => paper.id === "winhd-cases-2026")?.venueTags,
    ["TCAD", "CASES / EMSOFT / CODES"],
  );
  assert.equal(
    papers.find((paper) => paper.id === "winhd-cases-2026")?.type,
    "journal",
  );
});

test("one place can host several distinct conference editions", () => {
  const editions = getEditionsForPlace("san-francisco", conferenceEditions);
  assert.ok(editions.some((edition) => edition.id === "iccad-2023"));

  const hypotheticalRepeat = {
    id: "future-systems-2027",
    series: "Future Systems",
    year: 2027,
    startsOn: "2027-05-01",
    dates: "May 1–3, 2027",
    placeId: "san-francisco",
  };
  const withRepeat = [...conferenceEditions, hypotheticalRepeat];
  assert.equal(getEditionsForPlace("san-francisco", withRepeat).length, 2);
});

test("journal publications do not invent a conference location", () => {
  const journal = publications.find((publication) => publication.id === "isafe-tcad-2025");
  assert.ok(journal);
  assert.equal(journal.type, "journal");
  assert.equal(getEditionForPublication(journal, conferenceEditions), undefined);
});

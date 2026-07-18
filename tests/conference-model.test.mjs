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

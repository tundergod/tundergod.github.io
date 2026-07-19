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
  const winhd = papers.find((paper) => paper.id === "winhd-cases-2026");
  assert.equal(winhd?.venue, "CASES");
  assert.equal(winhd?.venueTags, undefined);
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

test("journal publications do not invent a conference location", () => {
  const journal = publications.find((publication) => publication.id === "isafe-tcad-2025");
  assert.ok(journal);
  assert.equal(journal.type, "journal");
  assert.equal(getEditionForPublication(journal, conferenceEditions), undefined);
});

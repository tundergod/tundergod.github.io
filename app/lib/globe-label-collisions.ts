export type LabelRect = {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  visible: boolean;
};

export type LabelGroup = {
  representativeId: string;
  placeIds: string[];
};

export function rectanglesOverlap(a: LabelRect, b: LabelRect, gap = 8) {
  return (
    a.left < b.right + gap &&
    a.right + gap > b.left &&
    a.top < b.bottom + gap &&
    a.bottom + gap > b.top
  );
}

export function groupOverlappingLabels(
  labels: LabelRect[],
  activePlaceId?: string,
  gap = 8,
): LabelGroup[] {
  const groups: LabelGroup[] = [];
  const visited = new Set<string>();

  for (const label of labels) {
    if (visited.has(label.id)) continue;
    visited.add(label.id);

    if (!label.visible || label.id === activePlaceId) {
      groups.push({ representativeId: label.id, placeIds: [label.id] });
      continue;
    }

    const placeIds = [label.id];
    for (let index = 0; index < placeIds.length; index += 1) {
      const member = labels.find(
        (candidate) => candidate.id === placeIds[index],
      );
      if (!member) continue;

      for (const candidate of labels) {
        if (
          visited.has(candidate.id) ||
          !candidate.visible ||
          candidate.id === activePlaceId ||
          !rectanglesOverlap(member, candidate, gap)
        ) continue;

        visited.add(candidate.id);
        placeIds.push(candidate.id);
      }
    }

    groups.push({ representativeId: placeIds[0], placeIds });
  }

  return groups.sort(
    (a, b) =>
      labels.findIndex((label) => label.id === a.representativeId) -
      labels.findIndex((label) => label.id === b.representativeId),
  );
}

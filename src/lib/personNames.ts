export type PersonNameFields = {
  firstName?: string;
  lastName?: string;
  name2First?: string;
  name2Last?: string;
  name3First?: string;
  name3Last?: string;
  /** @deprecated flat name lines */
  name1?: string;
  name2?: string;
  name3?: string;
  nativeName?: string;
  phoneticName?: string;
  chineseName?: string;
  pinyinName?: string;
};

function compact(value?: string): string {
  return (value ?? "").trim();
}

function joinPair(first?: string, last?: string): string {
  return `${compact(first)} ${compact(last)}`.trim();
}

function splitToPair(full: string): { first: string; last: string } {
  const trimmed = compact(full);
  if (!trimmed) return { first: "", last: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] ?? "", last: "" };
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

function line1(person: PersonNameFields): string {
  const joined = joinPair(person.firstName, person.lastName);
  if (joined) return joined;
  if (compact(person.name1)) return compact(person.name1);
  return "";
}

function line2(person: PersonNameFields): string {
  const joined = joinPair(person.name2First, person.name2Last);
  if (joined) return joined;
  return compact(person.name2) || compact(person.nativeName) || compact(person.chineseName);
}

function line3(person: PersonNameFields): string {
  const joined = joinPair(person.name3First, person.name3Last);
  if (joined) return joined;
  return compact(person.name3) || compact(person.phoneticName) || compact(person.pinyinName);
}

/** All name lines in order (skipping empty). */
export function getPersonNameLines(person: PersonNameFields): string[] {
  return [line1(person), line2(person), line3(person)].filter(Boolean);
}

export function getPrimaryName(person: PersonNameFields): string {
  const lines = getPersonNameLines(person);
  return lines[0] ?? "";
}

export function getExtraNameLines(person: PersonNameFields): string[] {
  return getPersonNameLines(person).slice(1);
}

export function getExtraNameLine(person: PersonNameFields): string | null {
  const extra = getExtraNameLines(person);
  return extra.length > 0 ? extra.join(" · ") : null;
}

export function migratePersonNames<T extends PersonNameFields>(person: T): T {
  let firstName = compact(person.firstName);
  let lastName = compact(person.lastName);
  let name2First = compact(person.name2First);
  let name2Last = compact(person.name2Last);
  let name3First = compact(person.name3First);
  let name3Last = compact(person.name3Last);

  if (!firstName && !lastName && compact(person.name1)) {
    const split = splitToPair(person.name1!);
    firstName = split.first;
    lastName = split.last;
  }
  if (!name2First && !name2Last) {
    const legacy2 = compact(person.name2) || compact(person.nativeName) || compact(person.chineseName);
    if (legacy2) {
      const split = splitToPair(legacy2);
      name2First = split.first;
      name2Last = split.last;
    }
  }
  if (!name3First && !name3Last) {
    const legacy3 = compact(person.name3) || compact(person.phoneticName) || compact(person.pinyinName);
    if (legacy3) {
      const split = splitToPair(legacy3);
      name3First = split.first;
      name3Last = split.last;
    }
  }

  const {
    name1: _n1,
    name2: _n2,
    name3: _n3,
    nativeName: _n,
    phoneticName: _p,
    chineseName: _c,
    pinyinName: _pi,
    ...rest
  } = person;

  return {
    ...rest,
    firstName,
    lastName,
    name2First: name2First || undefined,
    name2Last: name2Last || undefined,
    name3First: name3First || undefined,
    name3Last: name3Last || undefined,
  } as T;
}

export function migratePeople<T extends PersonNameFields>(people: T[]): T[] {
  return people.map(migratePersonNames);
}

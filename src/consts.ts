import type { Metadata, Site, Socials, LesMiserablesStructure } from "@types";

export const SITE: Site = {
  TITLE: "Tommy O'Keefe",
  DESCRIPTION: "This is primarily a space for me to talk about how I see the world",
  EMAIL: "tommyokeefe81@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 5,
  NUM_PROJECTS_ON_HOMEPAGE: 0,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "Astro Micro is an accessible theme for Astro.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "A collection of articles on topics I am passionate about.",
};

export const SERIES: Metadata = {
  TITLE: "Series",
  DESCRIPTION: "Blog posts that are part of a larger series.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION:
    "A collection of my projects with links to repositories and live demos.",
};

export const SOCIALS: Socials = [
  {
    NAME: "Bluesky",
    HREF: "https://bsky.app/profile/tommyokeefe.com",
  },
  {
    NAME: "LinkedIn",
    HREF: "https://www.linkedin.com/in/tommyokeefe/",
  },
];

export const LES_MISERABLES: LesMiserablesStructure = {
  'part-1': {
    title: 'Part One: Fantine',
    books: {
      'book-1': { title: 'I. An Upright Man' },
      'book-2': { title: 'II. The Outcast' },
      'book-3': { title: 'III. The In The Year 1817' },
      'book-4': { title: 'IV. To Trust Is Sometimes To Surrender' },
      'book-5': { title: 'V. Degradation' },
      'book-6': { title: 'VI. Javert' },
      'book-7': { title: 'VII. The Champmathieu Affair' },
      'book-8': { title: 'VIII. Counter-Stroke' }
    }
  },
  'part-2': {
    title: 'Part Two: Cosette',
    books: {
      'book-1': { title: 'I. Waterloo' },
      'book-2': { title: 'II. The Ship Orion' },
      'book-3': { title: 'III. Fulfilment Of A Promise' },
      'book-4': { title: 'IV. The Gorbeau Tenement' },
      'book-5': { title: 'V. Hunt In Darkness' },
      'book-6': { title: 'VI. Le Petit-Picpus' },
      'book-7': { title: 'VII. The Convent As An Abstract Idea' },
      'book-8': { title: 'VIII. Cemeteries Take What They Are Given' },
    },
  },
  'part-3': {
    title: 'Part Three: Marius',
    books: {
      'book-1': { title: 'I. Paris In Microcosm' },
      'book-2': { title: 'II. A Grand Bourgeois' },
      'book-3': { title: 'III. Grandfather And Grandson' },
      'book-4': { title: 'IV. The ABC Society' },
      'book-5': { title: 'V. The Virtues Of Misfortune' },
      'book-6': { title: 'VI. Conjunction Of Two Stars' },
      'book-7': { title: 'VII. Patron-Minette' },
      'book-8': { title: 'VIII. The Noxious Poor' },
    },
  },
  'part-4': {
    title: 'Part Four: The Idyll of the Rue Plumet and the Epic of the Rue Saint-Denis',
    books: {
      'book-1': { title: 'I. A Few Pages Of History' },
      'book-2': { title: 'II. Éponine' },
      'book-3': { title: 'III. The House In The Rue Plumet' },
      'book-4': { title: 'IV. Help From Below May Be Help From Above' },
      'book-5': { title: 'V. Of Which The End Does Not Resemble The Beginning' },
      'book-6': { title: 'VI. The Boy Gavroche' },
      'book-7': { title: 'VII. Argot' },
      'book-8': { title: 'VIII. Enchantment And Despair' },
      'book-9': { title: 'IX. Where Are They Going?' },
      'book-10': { title: 'X. 5 June 1832' },
      'book-11': { title: 'XI. The Straw In The Wind' },
      'book-12': { title: 'XII. Corinth' },
      'book-13': { title: 'XIII. Marius Enters The Darkness' },
      'book-14': { title: 'XIV. The Greatness Of Despair' },
      'book-15': { title: 'XV. In The Rue De L\'Homme-Armé' },
    },
  },
  'part-5': {
    title: 'Part Five: Jean Valjean',
    books: {
      'book-1': { title: 'I. War Within Four Walls' },
      'book-2': { title: 'II. The Entrails Of The Monster' },
      'book-3': { title: 'III. Mire, But The Soul' },
      'book-4': { title: 'IV. Javert In Disarray' },
      'book-5': { title: 'V. Grandson And Grandfather' },
      'book-6': { title: 'VI. The Sleepless Night' },
      'book-7': { title: 'VII. The Bitter Cup' },
      'book-8': { title: 'VIII. The Fading Light' },
      'book-9': { title: 'IX. Supreme Shadow, Supreme Dawn' },
    },
  },
};

export const CHAPTERS: { [key: string]: string } = {
  'chapter-1': 'Chapter One',
  'chapter-2': 'Chapter Two',
  'chapter-3': 'Chapter Three',
  'chapter-4': 'Chapter Four',
  'chapter-5': 'Chapter Five',
  'chapter-6': 'Chapter Six',
  'chapter-7': 'Chapter Seven',
  'chapter-8': 'Chapter Eight',
  'chapter-9': 'Chapter Nine',
  'chapter-10': 'Chapter Ten',
  'chapter-11': 'Chapter Eleven',
  'chapter-12': 'Chapter Twelve',
  'chapter-13': 'Chapter Thirteen',
  'chapter-14': 'Chapter Fourteen',
  'chapter-15': 'Chapter Fifteen',
  'chapter-16': 'Chapter Sixteen',
  'chapter-17': 'Chapter Seventeen',
  'chapter-18': 'Chapter Eighteen',
  'chapter-19': 'Chapter Nineteen',
  'chapter-20': 'Chapter Twenty',
}

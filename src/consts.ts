import type { Metadata, Site, Socials } from "@types";

export const SITE: Site = {
  TITLE: "Tommy O'Keefe",
  DESCRIPTION: "A repository of my ADHD fueled rants and ramblings",
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

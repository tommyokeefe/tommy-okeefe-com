import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    series: z.string().optional(),
    part: z.string().optional(),
    book: z.string().optional(),
    chapter: z.string().optional(),
  }),
});

const series = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    active: z.boolean()
  }),
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    demoURL: z.string().optional(),
    repoURL: z.string().optional(),
  }),
});

export const collections = { blog, projects, series };

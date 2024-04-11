import * as dotenv from 'dotenv';
import z from 'zod';

dotenv.config();

const envScheme = z.object({
  HYP_KEY: z.string().optional(),
});

const parsedEnv = envScheme.safeParse(process.env);

export const ENV = parsedEnv.success ? parsedEnv.data : {};

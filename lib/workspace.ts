import {z} from 'zod';
import {themeIds} from './appearance';
const entry=z.object({id:z.string().max(100),title:z.string().max(1000),url:z.string().max(4000),date:z.string().max(100).optional()});
export const workspace=z.object({bookmarks:z.array(entry).max(250),history:z.array(entry).max(200),notes:z.string().max(20000),settings:z.object({theme:z.enum(themeIds),density:z.enum(['comfortable','compact']).default('comfortable'),reduceMotion:z.boolean().default(false),newTab:z.boolean(),history:z.boolean(),safe:z.enum(['strict','moderate']),view:z.enum(['reader','live']),quality:z.enum(['fast','balanced','sharp']).default('balanced'),sessionMinutes:z.union([z.literal(2),z.literal(15),z.literal(30),z.literal(60),z.literal(120)]).default(60)})});

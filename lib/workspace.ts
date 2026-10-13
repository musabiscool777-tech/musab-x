import {z} from 'zod';
const entry=z.object({id:z.string().max(100),title:z.string().max(1000),url:z.string().max(4000),date:z.string().max(100).optional()});
export const workspace=z.object({bookmarks:z.array(entry).max(250),history:z.array(entry).max(200),notes:z.string().max(20000),settings:z.object({theme:z.enum(['dark','light']),newTab:z.boolean(),history:z.boolean(),safe:z.enum(['strict','moderate']),view:z.enum(['reader','live'])})});

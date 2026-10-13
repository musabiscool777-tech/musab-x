import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const accounts = sqliteTable('accounts', {id:text('id').primaryKey(),email:text('email').notNull(),name:text('name').notNull(),role:text('role').notNull().default('member'),disabled:integer('disabled').notNull().default(0),data:text('data').notNull().default('{}'),version:integer('version').notNull().default(0),created:text('created').notNull()});

export const sessions=sqliteTable('sessions',{tokenHash:text('token_hash').primaryKey(),accountId:text('account_id').notNull().references(()=>accounts.id,{onDelete:'cascade'}),expires:integer('expires').notNull()});
export const oauthAttempts=sqliteTable('oauth_attempts',{stateHash:text('state_hash').primaryKey(),verifier:text('verifier').notNull(),expires:integer('expires').notNull()});

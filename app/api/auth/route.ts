import {env} from 'cloudflare:workers';
import {emailConfigured} from '../../../lib/email-auth';
import {json} from '../../../lib/core';
export function GET(){return json({email:env.AUTH_MODE==='github'&&emailConfigured(env),provider:env.AUTH_MODE==='github'?'GitHub':'ChatGPT',signin:env.AUTH_MODE==='github'?'/auth/signin':'/signin-with-chatgpt?return_to=%2F',signout:env.AUTH_MODE==='github'?'/auth/signout':'/signout-with-chatgpt?return_to=%2F'})}

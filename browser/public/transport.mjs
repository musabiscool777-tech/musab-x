import EpoxyTransport from '/epoxy/index.mjs';
import {resilientTransport} from './transport-core.mjs?v=20261017b';
import {withHttpFallback} from './http-fallback.mjs?v=20261017b';
export default withHttpFallback(resilientTransport(EpoxyTransport));

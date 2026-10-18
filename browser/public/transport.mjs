import EpoxyTransport from '/epoxy/index.mjs';
import {resilientTransport} from './transport-core.mjs?v=20261018c';
import {withHttpFallback} from './http-fallback.mjs?v=20261018c';
export default withHttpFallback(resilientTransport(EpoxyTransport));

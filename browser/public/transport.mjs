import EpoxyTransport from '/epoxy/index.mjs';
import {resilientTransport} from './transport-core.mjs?v=20261017';
export default resilientTransport(EpoxyTransport);

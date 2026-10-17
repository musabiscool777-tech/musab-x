import EpoxyTransport from '/epoxy/index.mjs';
import {resilientTransport} from './transport-core.mjs';
export default resilientTransport(EpoxyTransport);

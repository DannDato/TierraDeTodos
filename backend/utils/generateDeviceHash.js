import { getDeviceContext } from "./deviceIdentity.js";

function generateDeviceHash(req){
    return getDeviceContext(req).deviceHash;
}

export default generateDeviceHash;

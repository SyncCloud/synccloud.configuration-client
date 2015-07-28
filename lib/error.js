/**
 * Custom client manager error
 * @type {ClientError}
 */
module.exports = ClientError;

function ClientError(code, msg) {
    if (!(this instanceof ClientError)) {
        return new ClientError(code, msg);
    }

    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.code = code;
    this.message = msg;
}

ClientError.prototype.wrap = function (err) {
    this.innerException = err;
    return this;
};

require('util').inherits(ClientError, Error);
class StejsError extends Error {}

class UnclosedTagError extends StejsError {}
class MissingEndTagError extends StejsError {}

module.exports = {
    StejsError,
    UnclosedTagError,
    MissingEndTagError,
}
const BLOCKED_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
]);

const MAX_DEPTH = 20;

const sanitizeObject = (
  value,
  depth = 0,
  seen = new WeakSet()
) => {
  if (
    value === null ||
    value === undefined ||
    typeof value !== 'object'
  ) {
    return;
  }

  // Prevent excessive nesting
  if (depth > MAX_DEPTH) {
    return;
  }

  // Prevent circular references
  if (seen.has(value)) {
    return;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) =>
      sanitizeObject(
        item,
        depth + 1,
        seen
      )
    );
    return;
  }

  Object.keys(value).forEach((key) => {
    // Block MongoDB operators and prototype pollution
    if (
      key.startsWith('$') ||
      key.includes('.') ||
      BLOCKED_KEYS.has(key)
    ) {
      delete value[key];
      return;
    }

    sanitizeObject(
      value[key],
      depth + 1,
      seen
    );
  });
};

const sanitizeRequest = (
  req,
  res,
  next
) => {
  try {
    sanitizeObject(req.body);
    sanitizeObject(req.params);
    sanitizeObject(req.query);

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = sanitizeRequest;